import { Observable } from "lib0/observable";

import google from "./gsi.js";
import User from "./User.js";

import * as cookie from "./cookie.js";
import * as storage from "./storage.js";

const CLIENT_ID_BASE = cookie.get("gcid");
const CLIENT_ID = `${CLIENT_ID_BASE}.apps.googleusercontent.com`;

class Auth extends Observable {
    #google = null;
    #id = null;

    // eslint-disable-next-line class-methods-use-this
    #user = null;

    constructor() {
        super();
        this.#init();
        storage.onchange(this.#onChange);
        this.#onChange();
    }

    #onChange = () => {
        const user = storage.get("identity");
        const changed = !User.eq(user, this.#user);

        if (!user) {
            cookie.del("identity");

            if (changed) {
                this.#user = null;
                this.emit("logout", []);
                this.emit("changed", []);
            }
        } else {
            // always update the cookies, it doesn't hurt
            // and helps ensure the cookies are in sync.
            cookie.set("identity", user.uuid);

            if (changed) {
                this.#user = new User(user);
                this.emit("login", []);
                this.emit("changed", []);
            }
        }
    };

    #init = async () => {
        this.#google = await google;
        this.#id = this.#google.accounts.id;
        this.#id.initialize({
            client_id: CLIENT_ID,
            callback: this.#handleCredentialResponse,
            auto_select: true,
            login_uri: globalThis.location.origin,
        });
        delete this.then;
        this.emit("loaded", []);
    };

    // eslint-disable-next-line class-methods-use-this
    #handleCredentialResponse = async (response) => {
        storage.set("identity", await (await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential }),
        })).json());
    };

    get loaded() { return !!this.#id; }

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    login() {
        if (!this.loaded) return;
        // Clear the g_state cookie to avoid a potential exponential cooldown.
        cookie.del("g_state");
        this.#id.prompt();
    }

    async logout() {
        this.#google.accounts.id.disableAutoSelect();
        storage.set("identity", null);
    }

    syncCookie() {
        if (this.authorized) {
            cookie.set("identity", this.user.uuid);
        } else {
            cookie.del("identity");
        }
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
