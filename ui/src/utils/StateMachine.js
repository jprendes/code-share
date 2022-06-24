/* eslint-disable no-loop-func */

class StateMachine {
    #states = {};

    context = {};

    constructor(states) {
        this.#states = states;
    }

    async start(state = "start", ...args) {
        while (state && state !== "end") {
            // eslint-disable-next-line no-await-in-loop
            [state, ...args] = await new Promise((resolve) => {
                this.#states[state]((...next) => resolve(next), ...args);
            });
        }
    }
}

export default StateMachine;
