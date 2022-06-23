import { html, render } from "lit";

import "@fontsource/roboto";

import { match } from "path-to-regexp";

import Room from "./model/Room.js";

import auth from "./utils/Auth.js";

import "./components/collab-loading.js";
import "./components/collab-room.js";
import "./components/collab-monaco-editor.js";
import "./components/collab-xterm-js.js";
import "./components/collab-quill-editor.js";
import "./components/collab-login.js";
import "./components/collab-error.js";

function getRoomName() {
    const matcher = match("/room/:roomName/:path(.*)?", { decode: decodeURIComponent });
    const { roomName } = matcher(global.location.pathname)?.params || {};
    return roomName;
}

async function makeRoomName() {
    const name = await (await fetch("/new-room")).text();
    global.history.pushState({}, "", `/room/${name}`);
    return name;
}

async function hasRoom(name) {
    try {
        return await (await fetch(`/has/${name}`)).json();
    } catch (e) {
        return false;
    }
}

const style = html`
    <style>
        html,
        body {
            display: grid;
            grid-template-columns: 100% 0;
            grid-template-rows: 100% 0;
            width: 100%;
            height: 100%;
            min-width: 640px;
            min-height: 480px;
            padding: 0;
            margin: 0;
            overflow: auto;
            background: #f3f3f3;
        }
        collab-room,
        #loading {
            grid-column: 1 / 2;
            grid-row: 1 / 2;
        }
        active-overlay,
        sp-tooltip {
            max-width: none !important;
        }
    </style>
`;

async function needsLogin(name) {
    if (!name) return true;
    return !await hasRoom(name);
}

async function main() {
    render(html`
        ${style}
        <collab-loading>Loading...</collab-loading>
    `, document.body);

    let name = getRoomName();

    // do the authorized check last to avoid race conditions
    if (await needsLogin(name) && !auth.authorized) {
        const authorized = new Promise((resolve) => {
            auth.once("login", resolve);
        });

        render(html`
            ${style}
            <collab-error
                icon="person"
                code="oops!"
                status="Log-in required"
                message="You must be logged in to create new rooms"
            >
                <collab-login></collab-login>
            </collab-error>
        `, document.body);

        // eslint-disable-next-line no-await-in-loop
        await authorized;

        render(html`
            ${style}
            <collab-loading>Loading...</collab-loading>
        `, document.body);

        if (!name) {
            try {
                // eslint-disable-next-line no-await-in-loop
                name = await makeRoomName();
            } catch (e) {
                render(html`
                    ${style}
                    <collab-error
                        icon="sentiment_dissatisfied"
                        code="oops!"
                        status="Something when wrong"
                        message="Error trying to create a new room"
                    >
                        <a href="javascript:window.location.href=window.location.href">Try again</a>
                    </collab-error>
                `, document.body);
                return;
            }
        }
    }

    const server = `${global.location.protocol === "http:" ? "ws:" : "wss:"}//${global.location.host}/doc/`;
    const room = new Room(server, name);

    await room.ready;

    render(html`
        ${style}
        <collab-room .room=${room}>
            <collab-monaco-editor slot="code" .room=${room}></collab-monaco-editor>
            <collab-quill-editor slot="text" .room=${room}></collab-quill-editor>
            <collab-xterm-js slot="term" .room=${room}></collab-xterm-js>
        </collab-room>
    `, document.body);
}

main();
