const Deferred = require("./Deferred.js");

class Task {
    #f = null;
    #deferred = new Deferred();
    #state = "pending";

    constructor(f) {
        this.#f = f;
    }

    get state() {
        return this.#state;
    }

    run = async () => {
        if (this.#state !== "pending") throw new Error("Task is not pending");
        try {
            this.#state = "running";
            const result = await this.#f();
            this.#state = "done";
            this.#f = null;
            this.#deferred.resolve(result);
        } catch (err) {
            this.#state = "errored";
            this.#f = null;
            this.#deferred.reject(err);
        }
    };

    cancel = () => {
        if (this.#state !== "pending") throw new Error("Task is not pending");
        this.#state = "canceled";
        this.#f = null;
        this.#deferred.reject(new Error("Task was canceled"));
    };

    then = (...args) => this.#deferred.then(...args);
    catch = (...args) => this.#deferred.catch(...args);
    finally = (...args) => this.#deferred.finally(...args);
}

module.exports = Task;
