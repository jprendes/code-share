const { Observable } = require("lib0/observable");
const {
    uniqueNamesGenerator,
    adjectives, colors, animals, names,
} = require("unique-names-generator");

const DB = require("./DB.js");
const { setupWSConnection, getYDoc } = require("./y-server.js");

const Identity = require("./Identity.js");
const Compiler = require("./Compiler.js");

const { PARALLEL_RUNS } = require("./config.js");
const TaskQueue = require("./utils/TaskQueue.js");

const { DEFAULT_PUBLIC } = require("./config.js");

function msg(type, payload = {}) {
    return { type, payload };
}

function send(conn, m) {
    conn.send(JSON.stringify(m));
}

const db = new DB("room");

class Room extends Observable {
    static #instances = new Map();
    static #queue = new TaskQueue(PARALLEL_RUNS);

    static byName(name) {
        if (!this.#instances.has(name)) {
            const room = new Room(name);
            return room;
        }
        return this.#instances.get(name);
    }

    static async has(name) {
        // check if we have the room in memory
        if (this.#instances.has(name)) return true;

        try {
            // check if we have the room in disk
            return !!await db.get(name);
        } catch (e) {
            // error loading room, probably it exists
            // but it's corrupted or something
            return true;
        }
    }

    static async withUniqueName() {
        let name = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
            name = uniqueNamesGenerator({
                dictionaries: [names, ["the"], adjectives, colors, animals],
                style: "lowerCase",
            }).replace(/_/g, "-");

            // eslint-disable-next-line no-await-in-loop
            if (!await this.has(name)) break;
        }

        return this.byName(name);
    }

    #name = "";
    #doc = null;
    #compiler = new Compiler();

    get name() { return this.#name; }

    #visibility = DEFAULT_PUBLIC ? "public" : "private";
    get visibility() { return this.#visibility; }
    set visibility(vis) {
        if (vis === this.visibility) return;
        if (vis !== "private" && vis !== "public") return;
        this.#visibility = vis;
        this.#save();
        this.broadcast(this.#visibilityMessage());
        this.emit("visibility", []);
    }

    #save = () => {
        db.set(this.name, {
            compileOutput: this.#compiler.output,
            language: this.#compiler.language,
            visibility: this.visibility,
        });
    };

    #load = async () => {
        if (this.#compiler.compilation) {
            await this.#compiler.kill();
        } else if (this.#task) {
            this.#task.cancel();
        }

        try {
            const stored = await db.get(this.name);
            const {
                compileOutput = this.#compiler.output,
                language = this.#compiler.language,
                visibility = this.visibility,
            } = stored || {};

            this.#visibility = visibility;
            this.#compiler.language = language;
            this.#compiler.output = compileOutput;
        } catch (e) {
            console.warn(`Error loading room ${this.name} from the database`);
            console.warn(e);
        }

        this.broadcast(this.#visibilityMessage());
        this.broadcast(this.#languageMessage());
        this.broadcast(this.#compilingMessage());
    };

    #init = async () => {
        await this.#load();
        delete this.then;
        this.emit("loaded", []);
    };

    constructor(name) {
        super();

        Room.#instances.set(name, this);

        this.#name = name;

        this.#doc = getYDoc(name);
        this.#doc.on("destroy", this.#destroy);
        this.#doc.awareness.on("change", this.#onAwarenessChange);

        this.#compiler.on("started", () => this.#onCompilerUpdate(true, ""));
        this.#compiler.on("progress", ({ data }) => this.#onCompilerUpdate(false, data));

        this.#init();
    }

    #onCompilerUpdate = (...args) => {
        this.#save();
        this.broadcast(this.#compilingMessage(...args));
    };

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    #destroy = () => {
        this.emit("destroy", []);
        Room.#instances.delete(this.name);
        super.destroy();
    };

    #identities = new Map();
    #connections = new Map();
    connect(conn, uuid, authorization) {
        if (!this.#checkAuth(conn, authorization)) return;

        let identity = this.#identities.get(uuid);
        if (!identity) {
            // If the identity doesn't exist yet in the room, create a new one
            identity = new Identity(uuid);
            identity.color = this.#proposeColor();
            this.#identities.set(uuid, identity);
            identity.on("orphan", () => {
                identity.destroy();
                this.#identities.delete(uuid);
            });
        }

        identity.connect(conn);

        this.#connections.set(conn, { identity, authorization });
        conn.on("close", () => this.#connections.delete(conn));

        send(conn, this.#visibilityMessage());
        send(conn, this.#languageMessage());
        send(conn, this.#compilingMessage());
        send(conn, this.#clientsMessage());

        setupWSConnection(conn, this.#doc);

        send(conn, msg("ready"));

        const checkAuth = () => this.#checkAuth(conn);
        authorization.on("unauthorized", checkAuth);
        this.on("visibility", checkAuth);
        conn.on("close", () => conn.off("visibility", checkAuth));

        conn.on("message", (data, isBinary) => {
            if (isBinary) return;
            let m = null;
            try {
                m = JSON.parse(data.toString());
            } catch (err) {
                console.warn("Received malformed message");
                return;
            }
            switch (m.type) {
            case "compile": { this.compile(); break; }
            case "cancel-compile": { this.killCompile(); break; }
            case "language": { this.language = m.payload; break; }
            case "auth": { authorization.tick(m.payload); break; }
            default: console.warn(`Received unknown message type ${m.type}`);
            }
        });
    }

    #checkAuth = (conn, authorization = this.#connections.get(conn)?.authorization) => {
        if (this.visibility === "public") return true;
        if (authorization?.authorized) return true;
        send(conn, this.#loginRequiredMessage());
        conn.close();
        return false;
    };

    #onAwarenessChange = ({ added, removed, updated }, conn) => {
        const clients = this.#connections.get(conn)?.identity.clients;
        added.forEach((clientId) => clients?.add(`${clientId}`));
        updated.forEach((clientId) => clients?.add(`${clientId}`));
        removed.forEach((clientId) => clients?.delete(`${clientId}`));
        this.broadcast(this.#clientsMessage());
    };

    #proposeColor = (N = 8) => {
        const counts = new Array(N).fill(0);
        for (const client of this.#identities.values()) {
            if (client.color < 0) continue; // no color yet
            ++counts[client.color % N];
        }
        const min = Math.min(...counts);
        return counts.indexOf(min);
    };

    broadcast(m) {
        m = JSON.stringify(m);
        for (const conn of this.#connections.keys()) {
            conn.send(m);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    #loginRequiredMessage = () => msg("error", "login_required");

    #visibilityMessage = () => msg("visibility", this.visibility);

    #languageMessage = () => msg("language", this.#compiler.language);

    #compilingMessage = (clear = true, data = clear ? this.#compiler.output : "") => {
        let status = "done";
        if (this.#task) {
            status = this.#task.pending ? "queued" : "compiling";
        }
        return msg("compiling", { status, clear, data });
    };

    #clientsMessage = () => {
        const identities = [];

        for (const {
            username, color, clients,
        } of this.#identities.values()) {
            identities.push({
                username,
                color,
                clients: [...clients],
            });
        }

        return msg("clients", identities);
    };

    get language() { return this.#compiler.language; }
    set language(language) {
        if (language === this.#compiler.language) return;
        try {
            this.#compiler.language = language;
        } catch (e) {
            // ignore invalid languages
        }
        this.broadcast(this.#languageMessage());
        this.#save();
    }

    #task = null;
    compile = async (queue = Room.#queue) => {
        if (this.#task) return;
        const code = this.#doc?.getText("code")?.toString() || "";
        this.#onCompilerUpdate(false);
        this.#task = queue.enqueue(() => {
            this.#onCompilerUpdate(true, "");
            return this.#compiler.compile(code);
        });
        try {
            await this.#task;
        } catch (e) {
            // ignore canceled tasks
        } finally {
            this.#task = null;
            this.#onCompilerUpdate(false);
        }
    };

    async killCompile() {
        if (!this.#task) return;
        if (this.#task.pending) {
            this.#task.cancel();
            this.broadcast(this.#compilingMessage(false));
        } else {
            await this.#compiler.kill();
        }
    }
}

module.exports = Room;
