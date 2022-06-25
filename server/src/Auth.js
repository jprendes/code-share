const { STATUS_CODES } = require("http");
const { Observable } = require("lib0/observable");
const cookie = require("./utils/cookie.js");
const sendJSON = require("./utils/sendJSON.js");

const Users = require("./Users.js");

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

    authorized(req) {
        return !!this.user(req);
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
            await this.#serve_logout(req, res);
            return;
        }

        cookie.set(res, "identity", user.uuid);

        sendJSON(res, user);
    };

    // eslint-disable-next-line class-methods-use-this
    #serve_logout = async (req, res) => {
        cookie.delete(res, "identity");
        sendJSON(res, null);
    };

    #serve_query = async (req, res) => {
        const user = this.user(req);
        if (!user) {
            await this.#serve_logout(req, res);
            return;
        }
        sendJSON(res, user);
    };
}

module.exports = Auth;
