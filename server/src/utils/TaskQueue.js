/* eslint-disable max-classes-per-file */
const Task = require("./Task.js");

class TaskQueue {
    #queue = [];
    #runner = false;
    #running = new Set();

    #N = 1;
    get N() { return this.#N; }
    set N(N) {
        // eslint-disable-next-line no-bitwise
        if ((typeof N) !== "number" || (N | 0) !== N || N < 1) {
            throw new Error("N must be an integer number greater than 0");
        }
        this.#N = N;
    }

    constructor(N = this.N) {
        this.N = N;
    }

    enqueue(f) {
        const task = new Task(f);
        this.#queue.push(task);
        this.#run();
        return {
            cancel: () => {
                this.#queue = this.#queue.filter((t) => t !== task);
                task.cancel();
            },
            then: task.then,
            catch: task.catch,
            finally: task.finally,
        };
    }

    #run = async () => {
        if (this.#runner) return;
        this.#runner = true;
        while (this.#queue.length > 0) {
            while (this.#running.size >= this.N) {
                // eslint-disable-next-line no-await-in-loop
                await Promise.race([...this.#running]);
            }
            const task = this.#queue.shift();
            const promise = (async () => {
                await task.run();
                this.#running.delete(promise);
            })();
            this.#running.add(promise);
        }
        this.#runner = false;
    };
}

module.exports = TaskQueue;
