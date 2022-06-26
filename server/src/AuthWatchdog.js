const { Observable } = require("lib0/observable");
const Watchdog = require("./Watchdog.js");

class AuthWatchdog extends Observable {
    #watchdog = new Watchdog();
    #auth = null;

    constructor(auth, timeout = 30e3) {
        super();
        this.#auth = auth;
        this.#watchdog.timeout = timeout;
        this.#watchdog.on("change", this.#onChange);
    }

    #onChange = () => {
        if (this.authorized) {
            this.emit("authorized", []);
        } else {
            this.emit("unauthorized", []);
        }
        this.emit("change", []);
    };

    get authorized() {
        return this.#watchdog.ticking;
    }

    get timeout() { return this.#watchdog.timeout; }
    set timeout(t) { this.#watchdog.timeout = t; }

    tick(uuid) {
        if (this.#auth.authorized(uuid)) {
            this.#watchdog.tick();
        } else {
            this.#watchdog.stop();
        }
    }

    stop() {
        this.#watchdog.stop();
    }

    destroy() {
        this.#watchdog.off("change", this.#onChange);
        this.#watchdog.destroy();
        super.destroy();
    }
}

module.exports = AuthWatchdog;
