const doUsername = require("do_username");
const { Observable } = require("lib0/observable");

const byConnection = new Map();

class Identity extends Observable {
    static byConnection(conn) {
        return byConnection.get(conn);
    }

    #connections = new Set();
    #uuid = "";

    username = doUsername.generate(20);
    color = -1;

    constructor(uuid) {
        super();
        this.#uuid = uuid;
    }

    get uuid() { return this.#uuid; }

    connect(conn) {
        this.#connections.add(conn);
        conn.on("close", () => {
            this.#connections.delete(conn);
            byConnection.delete(conn);
            if (this.orphan) this.emit("orphan", []);
        });
    }

    #clients = new Set();
    get clients() { return this.#clients; }

    get orphan() { return this.#connections.size === 0; }

    destroy() {
        for (const conn of this.#connections) {
            byConnection.delete(conn);
        }
        this.emit("destroy", []);
        super.destroy();
    }
}

module.exports = Identity;
