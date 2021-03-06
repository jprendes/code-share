#!/usr/bin/env node

const { uuidv4 } = require("lib0/random");

const HttpServer = require("./HttpServer.js");
const Proxy = require("./Proxy.js");
const Static = require("./Static.js");
const Auth = require("./Auth.js");
const ErrorPage = require("./ErrorPage.js");

const Room = require("./Room.js");

const cookie = require("./utils/cookie.js");
const sendJSON = require("./utils/sendJSON.js");

const {
    UI_ROOT, UI_HOST, UI_PORT, HTTPS, LISTEN, GAPI_CLIENT_ID,
} = require("./config.js");
const AuthWatchdog = require("./AuthWatchdog.js");

const server = new HttpServer({
    https: HTTPS,
    logError: console.error,
});

const auth = new Auth();

let ui;
let errorPage;
if (UI_ROOT) {
    ui = Static.fromRoot(UI_ROOT);
    errorPage = ErrorPage.fromStaticServer(ui);
} else {
    ui = new Proxy({ target: { host: UI_HOST, port: UI_PORT } });
    errorPage = ErrorPage.fromHttpServer(UI_HOST, UI_PORT);
}

function errorHandler(req, res, { code, err }) {
    if (err) console.error(err);
    return server.serve(`error/${code}`, req, res);
}

auth.onError(errorHandler);
ui.onError(errorHandler);

function session(req, res) {
    let sess = cookie.get(req, "session") || null;
    if (!res) return sess;
    sess = sess || uuidv4();
    cookie.set(res, "gcid", GAPI_CLIENT_ID);
    cookie.set(res, "session", sess);
    return sess;
}

server.http("/new-room", async (req, res) => {
    if (!auth.authorized(req)) {
        await server.serve("error/403", req, res);
        return;
    }
    const room = await Room.withUniqueName();
    res.writeHead(200);
    res.end(room.name);
});

server.http("~error/:code(\\d+)/:rest(.*)?", async (req, res, { code }) => {
    await errorPage.serve(req, res, code);
});

server.http("error/invalid-room", async (req, res) => {
    await errorPage.serve(req, res, {
        code: 404,
        title: "oops!",
        status: "Invalid room",
        message: "Room names must be at least 4 letters long.",
        action: "Start a new room",
    });
});

server.http("~/has/:roomName", async (req, res, { roomName }) => {
    const exists = await Room.has(roomName);
    if (!exists) {
        sendJSON(res, false);
        return;
    }
    const room = await Room.byName(roomName);
    sendJSON(res, room.visibility);
});

server.http("~/room/:roomName/:path(.*)?", (req, res, { roomName, path = "" }) => {
    session(req, res);
    if (roomName.length < 4) return server.serve("error/invalid-room", req, res);
    return ui.serve(req, res, { path: `/${path}` });
});

server.upgrade("/ws", (req, socket, head) => ui.serve(req, socket, head, {}));

server.http("~/auth/:path(.*)?", (req, res) => auth.serve(req, res));

server.http("~/:path(.*)", (req, res) => {
    session(req, res);
    return ui.serve(req, res, {});
});

server.ws("~/doc/:docName", async (conn, req, { docName }) => {
    const closeWith = (payload) => {
        conn.send(JSON.stringify({ type: "error", payload }));
        conn.close();
    };

    const sessionId = session(req);
    if (!sessionId) {
        closeWith("invalid_session");
        return;
    }

    if (docName.length < 4) {
        closeWith("invalid_room");
        return;
    }

    if (!auth.authorized(req) && !await Room.has(docName)) {
        closeWith("login_required");
        return;
    }

    const room = await Room.byName(docName);

    const authorization = new AuthWatchdog(auth);
    conn.on("close", () => authorization.destroy());
    authorization.tick(req);

    room.connect(conn, sessionId, authorization);

    await HttpServer.wait(conn);
});

server.listen(LISTEN);
console.log(`running at ${LISTEN
    .replace(/^tcp:\/\/0.0.0.0/, "tcp://localhost")
    .replace(/^tcp:/, HTTPS ? "https:" : "http")}`);
