const { Observable } = require("lib0/observable");

class Watchdog extends Observable {
    static get STOPPED() { return 0; }
    static get TICKING() { return 1; }
    static get ALERTED() { return 2; }

    #id = null;
    #status = Watchdog.STOPPED;

    timeout = null;

    constructor(timeout = 10e3) {
        super();
        this.timeout = timeout;
    }

    tick() {
        if (this.#id !== null) clearTimeout(this.#id);
        this.#id = setTimeout(() => {
            this.#id = null;
            this.#status = Watchdog.ALERTED;
            this.emit("alert", []);
            this.emit("change", []);
        }, this.timeout);
        this.#status = Watchdog.TICKING;
        this.emit("tick", []);
        this.emit("change", []);
    }

    stop() {
        if (this.#id !== null) clearTimeout(this.#id);
        this.#id = null;
        this.#status = Watchdog.STOPPED;
        this.emit("stop", []);
        this.emit("change", []);
    }

    get status() { return this.#status; }
    get ticking() { return this.status === Watchdog.TICKING; }
    get stopped() { return this.status === Watchdog.STOPPED; }
    get alerted() { return this.status === Watchdog.ALERTED; }
}

module.exports = Watchdog;
