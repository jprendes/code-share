import { Observable } from "lib0/observable";

class Timer extends Observable {
    #id = null;

    timeout = null;

    constructor(timeout = 10e3) {
        super();
        this.timeout = timeout;
    }

    start() {
        if (this.#id !== null) clearInterval(this.#id);
        this.#id = setInterval(() => {
            this.emit("tick", []);
        }, this.timeout);
        this.emit("start", []);
    }

    stop() {
        if (this.#id !== null) clearInterval(this.#id);
        this.emit("stop", []);
    }
}

export default Timer;
