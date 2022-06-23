const { STATUS_CODES } = require("http");
const { Observable } = require("lib0/observable");
const cookie = require("./utils/cookie.js");

const Users = require("./Users.js");

function sendJSON(res, val) {
    res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
    });
    res.end(JSON.stringify(val));
}

class Auth extends Observable {
    #users = new Users();

    constructor() {
        super();
        // set default onError handler
        this.onError(null);
        this.#init();
    }

    #init = async () => {
        this.#handlers = {
            "/auth/login": this.#serve_login,
            "/auth/logout": this.#serve_logout,
            "/auth/query": this.#serve_query,
        };
        await this.#users;
        delete this.then;
        this.emit("loaded", []);
    };

    // Make the class awaitable
    then = (callback) => {
        this.once("loaded", () => callback(this));
    };

    #onError = null;
    onError(fcn) {
        if (!fcn) {
            fcn = (req, res, { code, status }) => {
                res.writeHead(code, status, { "Content-Type": "text/plain" });
                res.end(status);
            };
        }
        this.#onError = fcn;
        return this;
    }

    #handlers = null;

    async serve(req, res, options = {}) {
        const path = decodeURIComponent(options.path || req.url);
        const handler = this.#handlers[path];
        if (!handler) {
            return this.#onError(req, res, { code: 404, status: STATUS_CODES[404] });
        }
        await this.#users;
        return handler(req, res);
    }

    user(req) {
        const uuid = cookie.get(req, "identity");
        const user = this.#users.byUuid(uuid);
        return user || null;
    }

    #serve_login = async (req, res) => {
        const body = await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (fragments) => chunks.push(fragments));
            req.on("end", () => resolve(Buffer.concat(chunks).toString()));
            req.on("error", reject);
        });

        const { token } = JSON.parse(body);
        const user = token && await this.#users.fromToken(token);

        if (!user) {
            await this.#serve_logout();
            return;
        }

        cookie.set(res, "identity", user.uuid);

        const { id, uuid, ...rest } = user;
        sendJSON(res, rest);
    };

    // eslint-disable-next-line class-methods-use-this
    #serve_logout = async (req, res) => {
        cookie.delete(res, "identity");
        sendJSON(null);
    };

    #serve_query = async (req, res) => {
        const user = this.user(req);
        if (!user) {
            await this.#serve_logout();
            return;
        }
        const { id, uuid, ...rest } = user;
        sendJSON(res, rest);
    };
}

module.exports = Auth;
