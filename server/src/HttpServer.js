/* eslint-disable max-classes-per-file */
const { createServer: createHttpServer, ServerResponse, STATUS_CODES } = require("http");
const { createServer: createHttpsServer } = require("https");
const { parse } = require("url");
const { Server: WsServer, WebSocket } = require("ws");
const { match } = require("path-to-regexp");
const { Duplex } = require("stream");
const selfsigned = require("selfsigned");
const { unlink } = require("fs/promises");

const DB = require("./DB.js");

const db = new DB("config");

function massageRoute(route) {
    let f = route;
    if (typeof route === "string") {
        if (route.startsWith("~")) {
            const matcher = match(route.slice(1), { decode: decodeURIComponent });
            f = (url) => matcher(url)?.params;
        } else {
            f = (url) => (url === route ? {} : false);
        }
    } else if (route instanceof RegExp) {
        f = (url) => route.exec(url);
    } else if (!(route instanceof Function)) {
        throw new Error("route should be a string, regex or function");
    }
    return f;
}

function isClosed(conn) {
    if (conn instanceof ServerResponse) return conn.writableEnded;
    if (conn instanceof WebSocket) return [conn.CLOSING, conn.CLOSED].includes(conn.readyState);
    if (conn instanceof Duplex) return conn.writableEnded;
    throw new Error("Expected http response, WebSocket, or duplex socket");
}

async function certificates(cn = "example.com") {
    const persisted = await db.get("certificates");
    if (persisted) return persisted;

    const pems = selfsigned.generate([{
        name: "commonName",
        value: cn,
    }], { days: 365 });
    const certs = {
        key: pems.private,
        cert: pems.cert,
    };
    db.set("certificates", certs);
    return certs;
}

class HttpServer {
    #server = null;

    #handlers = null;
    #fallback_handlers = null;

    #wss = null;

    #logError = null;

    constructor({
        https = false,
        logError = () => { },
    } = {}) {
        this.#logError = logError;
        this.#handlers = [];

        // set up the fallback handlers
        this.http("~error/:code(\\d+)/:rest(.*)?", (req, res, { code }) => {
            res.writeHead(parseInt(code, 10), STATUS_CODES[code], {
                "Content-Type": "text/plain",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            });
            res.end(STATUS_CODES[code]);
        });
        this.ws("error/1003", (conn) => {
            try {
                conn.close(1003, "Unsupported");
            } catch (err) {
                this.#logError(err);
                conn.terminate();
            }
        });

        this.#fallback_handlers = this.#handlers;
        this.#handlers = [];

        this.#initialized = this.#init(https);
    }

    http(route, handler) {
        const f = massageRoute(route);
        this.#handlers.push(["", f, handler]);
    }

    ws(route, handler) {
        const f = massageRoute(route);
        this.#handlers.push(["ws", f, handler]);
    }

    upgrade(route, handler) {
        const f = massageRoute(route);
        this.#handlers.push(["upgrade", f, handler]);
    }

    #findHandler = (prefix, reqPath) => {
        const handlers = [...this.#handlers, ...this.#fallback_handlers];
        for (const [pref, route, handler] of handlers) {
            if (pref === prefix) {
                const params = route(reqPath);
                if (params) return { handler, params };
            }
        }
        return {};
    };

    #findHttpHandler = (url) => {
        const { handler, params } = this.#findHandler("", url);
        if (!handler) return null;
        return (req, res, extra = {}) => handler(req, res, { ...params, ...extra });
    };

    #findWsHandler = (url) => {
        const { handler, params } = this.#findHandler("ws", url);
        if (!handler) return null;
        return (conn, req, extra = {}) => handler(conn, req, { ...params, ...extra });
    };

    #findUpgradeHandler = (url) => {
        const { handler, params } = this.#findHandler("upgrade", url);
        if (!handler) return null;
        return (r, s, h, extra = {}) => handler(r, s, h, { ...params, ...extra });
    };

    async serve(url, ...args) {
        if (args[1] instanceof ServerResponse) return this.#serve_http(url, ...args);
        if (args[0] instanceof WebSocket) return this.#serve_ws(url, ...args);
        if (args[1] instanceof Duplex) return this.#serve_upgrade(url, ...args);
        throw new Error("Expected http response, WebSocket, or duplex socket");
    }

    #serve_http = async (url, req, res) => {
        const handler = this.#findHttpHandler(url);
        if (handler) {
            await handler(req, res);
        } else if (this.#findWsHandler(url)) {
            await this.#findHttpHandler("error/426")(req, res);
        } else {
            await this.#findHttpHandler("error/404")(req, res);
        }
    };

    #serve_ws = async (url, conn, req) => {
        const handler = this.#findWsHandler(url);
        if (handler) {
            await handler(conn, req);
        } else {
            await this.#findWsHandler("error/1003")(conn, req);
        }
    };

    #serve_upgrade = async (url, req, socket, head) => {
        const handler = this.#findUpgradeHandler(url);
        let doUpgrade = true;
        if (handler) {
            doUpgrade = await handler(req, socket, head);
        }
        return doUpgrade;
    };

    #initialized = null;
    #init = async (https) => {
        if (https === true) {
            this.#server = createHttpsServer(await certificates());
        } else if (https) {
            this.#server = createHttpsServer(https);
        } else {
            this.#server = createHttpServer();
        }

        this.#wss = new WsServer({ noServer: true });

        this.#server.on("request", async (req, res) => {
            try {
                await this.#serve_http(req.url, req, res);
                if (!isClosed(res)) {
                    throw new Error("Request still pending");
                }
            } catch (error) {
                this.#logError(`Error while serving ${req.url}:`);
                this.#logError(error);
                try {
                    await this.#findHttpHandler("error/500")(req, res, { error });
                } catch (err) {
                    this.#logError(err);
                    res.end();
                }
            }
        });

        this.#server.on("upgrade", async (req, socket, head) => {
            try {
                const doUpgrade = await this.#serve_upgrade(req.url, req, socket, head);
                if (doUpgrade) {
                    this.#wss.handleUpgrade(req, socket, head, (conn) => {
                        this.#wss.emit("connection", conn, req);
                    });
                } else if (!isClosed(socket)) {
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                }
            } catch (error) {
                this.#logError(`Error while serving ${req.url}:`);
                this.#logError(error);
                socket.destroy();
            }
        });

        this.#wss.on("connection", async (conn, req) => {
            try {
                await this.#serve_ws(req.url, conn, req);
                if (!isClosed(conn)) {
                    throw new Error("WebSocket still open");
                }
            } catch (error) {
                this.#logError(`Error while serving ${req.url}:`);
                this.#logError(error);
                try {
                    conn.close(1011, "Internal server error");
                } catch (err) {
                    this.#logError(err);
                    conn.terminate();
                }
            }
        });
    };

    async listen(address, opts = {}) {
        let url;
        try {
            url = parse(address);
        } catch (e) {
            throw new Error(`Invalid listening url ${JSON.stringify(address)}`);
        }
        if (!["tcp:", "unix:"].includes(url.protocol)) {
            throw new Error(`Invalid listening url ${JSON.stringify(address)}`);
        }
        await this.#initialized;
        if (url.protocol === "tcp:") {
            opts = {
                host: url.hostname,
                port: parseInt(url.port, 10),
                ...opts,
            };
        } else if (url.protocol === "unix:") {
            try {
                await unlink(url.pathname);
            } catch (e) {
                // no-op
            }
            opts = {
                path: url.pathname,
                ...opts,
            };
        } else {
            // unreachable
        }
        this.#server.listen(opts);
    }

    static wait(conn) {
        return new Promise((resolve) => {
            if (isClosed(conn)) {
                resolve();
            } else if (conn instanceof ServerResponse) {
                conn.on("close", resolve);
                conn.on("error", resolve);
            } else if (conn instanceof WebSocket) {
                conn.on("close", resolve);
                conn.on("error", resolve);
            } else if (conn instanceof Duplex) {
                conn.on("finish", resolve);
                conn.on("error", resolve);
            } else {
                // unreachable, the call to isClosed ensures
                // it is one of the above cases
            }
        });
    }

    static STATUS_CODES = STATUS_CODES;
}

module.exports = HttpServer;
module.exports.HttpServer = HttpServer;
