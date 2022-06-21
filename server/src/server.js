#!/usr/bin/env node

const { uuidv4 } = require("lib0/random");
const cookie = require("cookie");

const HttpServer = require("./HttpServer.js");
const Proxy = require("./Proxy.js");
const Static = require("./Static.js");
const ErrorPage = require("./ErrorPage.js");

const { verify } = require("./Login.js");

const Room = require("./Room.js");

const {
    UI_ROOT, UI_HOST, UI_PORT, HOST, PORT,
} = require("./config.js");

const server = new HttpServer({
    logError: console.error,
});

let ui;
let errorPage;
if (UI_ROOT) {
    ui = Static.fromRoot(UI_ROOT);
    errorPage = ErrorPage.fromStaticServer(ui);
} else {
    ui = new Proxy({ target: { host: UI_HOST, port: UI_PORT } });
    errorPage = ErrorPage.fromHttpServer(UI_HOST, UI_PORT);
}

ui.onError((req, res, { code, err }) => {
    if (err) console.error(err);
    return server.serve(`error/${code}`, req, res);
});

function session(req, res) {
    const cookies = cookie.parse(req.headers?.cookie || "");
    if (cookies.session) return cookies.session;
    if (!res) return null;
    const id = uuidv4();
    res.setHeader("Set-Cookie", `session=${id}; SameSite=Strict; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}`);
    return id;
}

server.http("/room/new", async (req, res) => {
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

server.http("~/room/:roomName/:path(.*)?", (req, res, { roomName, path = "" }) => {
    session(req, res);
    if (roomName.length < 4) return server.serve("error/invalid-room", req, res);
    return ui.serve(req, res, { path: `/${path}` });
});

server.upgrade("/ws", (req, socket, head) => ui.serve(req, socket, head, {}));

server.http("/auth/login", async (req, res) => {
    session(req, res);
    const body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (fragments) => chunks.push(fragments));
        req.on("end", () => resolve(Buffer.concat(chunks).toString()));
        req.on("error", reject);
    });
    const { token } = JSON.parse(body);
    const user = verify(token);
    if (!user) {
        await server.serve("error/403", req, res);
        return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(user));
});

server.http("~/:path(.*)", (req, res) => {
    session(req, res);
    return ui.serve(req, res, {});
});

server.ws("~/doc/:docName", async (conn, req, { docName }) => {
    const sessionId = session(req);
    if (!sessionId) {
        conn.close();
        return;
    }

    if (docName.length < 4) {
        conn.close();
        return;
    }

    const room = await Room.byName(docName);
    room.connect(conn, sessionId);

    await HttpServer.wait(conn);
});

server.listen({ host: HOST, port: PORT });
console.log(`running at http://${HOST !== "0.0.0.0" ? HOST : "localhost"}:${PORT}/`);
