/* eslint-disable no-loop-func */

class StateMachine {
    #states = {};
    #cleanup = [];

    context = {};

    constructor(states) {
        this.#states = states;
    }

    own(f) {
        this.#cleanup.push(f);
    }

    async start(state = "start", ...args) {
        while (state && state !== "end") {
            // eslint-disable-next-line no-await-in-loop
            [state, ...args] = await new Promise((resolve) => {
                this.#states[state]((...next) => resolve(next), ...args);
            });
            this.#cleanup.forEach((f) => f());
            this.#cleanup = [];
        }
    }
}

export default StateMachine;
