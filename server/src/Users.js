const { Observable } = require("lib0/observable");
const { uuidv4 } = require("lib0/random");
const DB = require("./DB.js");
const { verify } = require("./Login.js");

const db = new DB("users");

class Users extends Observable {
    #byUuid = new Map();
    #byId = new Map();

    #init = async () => {
        for await (const [key, value] of db.iterator()) {
            this.#byId.set(key, value);
            this.#byUuid.set(value.uuid, value);
        }
        delete this.then;
        this.emit("loaded", []);
    };

    constructor() {
        super();
        this.#init();
    }

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    byUuid(uuid) {
        return this.#byUuid.get(uuid) || null;
    }

    byId(id) {
        return this.#byId.get(id) || null;
    }

    async fromToken(token) {
        const user = await verify(token);
        if (!user) return null;

        const persisted = this.byId(user.id);

        if (!persisted) {
            user.uuid = uuidv4();
            console.log(user);
            this.#byId.set(user.id, user);
            this.#byUuid.set(user.uuid, user);
            db.set(user.id, user);
            return user;
        }

        Object.assign(persisted, user);
        db.set(user.id, persisted);
        return persisted;
    }
}

module.exports = Users;
