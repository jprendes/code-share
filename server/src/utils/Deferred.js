class Deferred {
    #promise = null;
    #reject = null;
    #resolve = null;
    #state = "pending";

    constructor() {
        this.#promise = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
    }

    get state() { return this.#state; }

    resolve(val) {
        if (this.state !== "pending") return;
        this.#state = "resolved";
        this.#resolve(val);
    }

    reject(val) {
        if (this.state !== "pending") return;
        this.#state = "rejected";
        this.#reject(val);
    }

    then = (...args) => this.#promise.then(...args);
    catch = (...args) => this.#promise.catch(...args);
    finally = (...args) => this.#promise.finally(...args);
}

module.exports = Deferred;
