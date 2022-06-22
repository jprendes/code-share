const httpProxy = require("http-proxy");
const { ServerResponse, STATUS_CODES } = require("http");
const { wait } = require("./HttpServer.js");

class Proxy {
    #proxy = null;

    constructor(opts) {
        // set default onError handlers
        this.onError(null);
        this.onWsError(null);

        this.#proxy = httpProxy.createProxyServer({
            ws: true,
            target: { host: "localhost", port: 8080 },
            ...opts,
        });
    }

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

    #onWsError = null;
    onWsError(fcn) {
        if (!fcn) {
            fcn = (req, socket, head, { err }) => {
                console.log(err);
                socket.destroy();
            };
        }
        this.#onWsError = fcn;
        return this;
    }

    serve(...args) {
        if (args[1] instanceof ServerResponse) {
            return this.#http(...args);
        }
        return this.#ws(...args);
    }

    #http = (req, res, options = {}, onError = this.#onError) => new Promise((resolve) => {
        wait(res).then(resolve);
        req.url = options.path || req.url;
        this.#proxy.web(req, res, options, async (err) => {
            await onError(req, res, { code: 500, status: STATUS_CODES[500], err });
            resolve();
        });
    });

    #ws = (req, socket, head, options = {}, onError = this.#onWsError) => new Promise((resolve) => {
        wait(socket).then(resolve);
        req.url = options.path || req.url;
        this.#proxy.ws(req, socket, head, options, async (err) => {
            console.log(err);
            await onError(req, socket, head, { err });
            resolve();
        });
    });
}

module.exports = Proxy;
