import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { Observable } from "lib0/observable";

import Color from "color";
import { indexToColor } from "../utils/colors.js";

import { WebsocketProvider } from "../yjs/y-websocket.js";
import { MonacoBinding } from "../yjs/y-monaco.js";
import { QuillBinding } from "../yjs/y-quill.js";

export default class Room extends Observable {
    #doc = new Y.Doc();
    #persistence = null;
    #provider = null;

    constructor(server, name) {
        super();
        this.#init(server, name);
    }

    #init = async (server, name) => {
        name = await name;

        this.#persistence = new IndexeddbPersistence(name, this.#doc);
        this.#provider = new WebsocketProvider(server, name, this.#doc);

        this.#provider.on("message", this.#onMessage);

        this.#provider.on("status", this.#onProviderStatus);

        this.#provider.awareness.setLocalStateField("collab-ready", { random: Math.random().toString(16).slice(2) });
        window.addEventListener("beforeunload", this.#beforeUnload, false);
    };

    #onMessage = (str) => {
        const { type, payload } = JSON.parse(str);
        switch (type) {
        case "clients": { this.#onClients(payload); break; }
        case "compiling": { this.#onCompiling(payload); break; }
        case "language": { this.#onLanguage(payload); break; }
        case "ready": { this.#onReady(); break; }
        default: // unreachable
        }
    };

    #isReady = false;
    #onReady = () => {
        this.emit("ready", []);
        this.emit("status", [{ status: "ready" }]);
        this.#isReady = true;
    };

    #onProviderStatus = ({ status }) => {
        if (status !== "disconnected") return;
        this.emit("disconnected", []);
        this.emit("status", [{ status: "disconnected" }]);
        this.#isReady = false;
    };

    get ready() {
        if (this.#isReady) {
            return Promise.resolve(this);
        }
        return new Promise((resolve) => {
            this.on("ready", () => resolve(this));
        });
    }

    get isReady() {
        return this.#isReady;
    }

    get clientId() {
        return this.#doc.clientID.toString();
    }

    #clients = {};
    #others = [];
    #me = null;

    get clients() { return this.#clients; }
    get others() { return this.#others; }
    get me() { return this.#me; }

    #onClients = (identities) => {
        this.#me = null;
        this.#others = [];
        this.#clients = {};

        for (const { ...identity } of identities) {
            identity.me = identity.clients.includes(this.clientId);
            identity.color = Color(indexToColor(identity.color));

            if (identity.me) {
                this.#me = identity;
                identity.me = true;
            } else {
                this.#others.push(identity);
                identity.me = false;
            }
            for (const clientId of identity.clients) {
                this.#clients[clientId] = identity;
            }
        }

        this.emit("clients", []);
    };

    #compiling = false;
    #queued = false;
    #compileOutput = "";
    get compiling() { return this.#compiling; }
    get queued() { return this.#queued; }
    get compileOutput() { return this.#compileOutput; }
    #onCompiling = ({
        status,
        data,
        clear,
        ...payload
    }) => {
        this.#queued = (status === "queued");
        this.#compiling = (status !== "done");
        if (clear) {
            this.#compileOutput = "";
        }
        if (data) {
            this.#compileOutput += data;
        }
        this.emit("compiling", [{
            status,
            data,
            clear,
            ...payload,
        }]);
    };

    #beforeUnload = () => {
        this.destroy();
    };

    get name() {
        return this.#provider.roomname;
    }

    #send = (type, payload = null) => {
        this.#provider.send(JSON.stringify({ type, payload }));
    };

    #language = "";
    get language() { return this.#language; }
    set language(language) {
        if (this.#language === language) return;
        this.#language = language;
        this.#send("language", language);
        this.emit("language", [this.language]);
    }

    #onLanguage = (language) => {
        if (this.#language === language) return;
        this.#language = language;
        this.emit("language", [this.language]);
    };

    compile() {
        this.#send("compile");
    }

    cancelCompilation() {
        this.#send("cancel-compile");
    }

    #codeBindings = new Set();
    bindCodeEditor(text, editor, model = editor.getModel()) {
        const binding = new MonacoBinding(
            this.#doc.getText(text),
            model,
            new Set([editor]),
            this.#provider.awareness,
            (clientId) => ({
                cursor: [`yRemoteCursor-${clientId}`],
                selection: [`yRemoteSelection-${clientId}`],
            }),
        );
        this.#codeBindings.add(binding);

        return () => {
            if (this.#codeBindings.has(binding)) {
                binding.destroy();
                this.#codeBindings.delete(binding);
            }
        };
    }

    #textBindings = new Set();
    bindTextEditor(text, editor) {
        const binding = new QuillBinding(
            this.#doc.getText(text),
            editor,
            this.#provider.awareness,
        );
        this.#textBindings.add(binding);

        return () => {
            if (this.#textBindings.has(binding)) {
                binding.destroy();
                this.#textBindings.delete(binding);
            }
        };
    }

    destroy() {
        this.#provider.disconnect();

        for (const binding of this.#codeBindings) {
            binding.destroy();
        }
        this.#codeBindings.clear();

        for (const binding of this.#textBindings) {
            binding.destroy();
        }
        this.#textBindings.clear();

        this.#provider.destroy();
        this.#persistence.destroy();
        this.#doc.destroy();

        window.removeEventListener("beforeunload", this.#beforeUnload, false);

        super.destroy();
    }
}
