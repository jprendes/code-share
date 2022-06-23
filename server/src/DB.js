const { Level } = require("level");
const { DB_ROOT } = require("./config.js");

const db = new Level(DB_ROOT, { valueEncoding: "json" });

class DB {
    #db = null;

    constructor(name = "") {
        if (!name) {
            this.#db = db;
        } else {
            this.#db = db.sublevel(name, { valueEncoding: "json" });
        }
    }

    set(key, value) {
        return this.#db.put(key, value);
    }

    async get(key) {
        const [value] = await this.#db.getMany([key]);
        return value;
    }

    delete(key) {
        this.#db.del(key);
    }

    iterator() {
        return this.#db.iterator();
    }

    keys() {
        return this.#db.keys();
    }

    values() {
        return this.#db.values();
    }
}

module.exports = DB;
