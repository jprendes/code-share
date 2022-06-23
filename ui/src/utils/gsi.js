import { Observable } from "lib0/observable";

const gsi = new Promise((resolve) => {
    const script = document.createElement("script");
    script.addEventListener("load", () => {
        resolve(globalThis.google);
    }, { once: true });
    script.addEventListener("readystatechange", () => {
        if (script.readyState === "complete") {
            resolve(globalThis.google);
        }
    });
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    script.src = "https://accounts.google.com/gsi/client";
});

class Google extends Observable {
    #google = null;

    constructor() {
        super();
        this.#init();
    }

    #init = async () => {
        this.#google = await gsi;
        delete this.then;
        this.emit("loaded", []);
    };

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    get accounts() {
        return this.#google?.accounts;
    }
}

export default new Google();
