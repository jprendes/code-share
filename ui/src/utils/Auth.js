import { Observable } from "lib0/observable";

import google from "./gsi.js";
import User from "./User.js";

const CLIENT_ID_BASE = document.cookie
    .split("; ")
    .find((row) => row.startsWith("gcid="))
    ?.split("=")[1];
const CLIENT_ID = `${CLIENT_ID_BASE}.apps.googleusercontent.com`;

class Auth extends Observable {
    #google = null;
    #id = null;

    #user = null;
    #setUser = (user) => {
        if (user) {
            user = new User(user);
            if (!this.#user?.eq(user)) {
                this.#user = user;
                this.emit("change", [this.#user]);
            }
        } else if (this.#user) {
            this.#user = null;
            this.emit("change", [this.#user]);
        }
    };

    constructor() {
        super();
        this.#init();
    }

    #init = async () => {
        this.#google = await google;
        this.#id = this.#google.accounts.id;
        this.#id.initialize({
            client_id: CLIENT_ID,
            callback: this.#handleCredentialResponse,
            auto_select: true,
            login_uri: globalThis.location.origin,
        });
        await this.query();
        delete this.then;
        this.emit("loaded", []);
    };

    #handleCredentialResponse = async (response) => {
        const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential }),
        });
        this.#setUser(await res.json());
    };

    get loaded() { return !!this.#id; }

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    login() {
        if (!this.loaded) return;
        // Clear the g_state cookie to avoid a potential exponential cooldown.
        document.cookie = "g_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        this.#id.prompt();
    }

    async logout() {
        await fetch("/auth/logout");
        this.#google.accounts.id.disableAutoSelect();
        this.#setUser(null);
    }

    async query() {
        const res = await fetch("/auth/query");
        this.#setUser(await res.json());
    }

    get authorized() {
        return !!this.#user;
    }

    get user() {
        return this.#user;
    }
}

const auth = new Auth();

export default auth;
