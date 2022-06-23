import { html, render } from "lit";
import { until } from "lit/directives/until.js";

import "@fontsource/roboto";

import { match } from "path-to-regexp";

import Room from "./model/Room.js";

import "./components/collab-loading.js";
import "./components/collab-room.js";
import "./components/collab-monaco-editor.js";
import "./components/collab-xterm-js.js";
import "./components/collab-quill-editor.js";

async function main() {
    async function makeRoomName() {
        const name = await (await fetch("/new-room")).text();
        global.history.pushState({}, "", `/room/${name}`);
        return name;
    }

    const {
        roomName,
    } = match("/room/:roomName/:path(.*)?", { decode: decodeURIComponent })(global.location.pathname)?.params || {};

    const server = `${global.location.protocol === "http:" ? "ws:" : "wss:"}//${global.location.host}/doc/`;
    const room = new Room(server, roomName || makeRoomName());

    render(html`
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
        ${until(room.ready.then(() => html`
            <collab-room .room=${room}>
                <collab-monaco-editor slot="code" .room=${room}></collab-monaco-editor>
                <collab-quill-editor slot="text" .room=${room}></collab-quill-editor>
                <collab-xterm-js slot="term" .room=${room}></collab-xterm-js>
            </collab-room>
        `), html`
            <collab-loading>Loading...</collab-loading>
        `)}
    `, document.body);
}

main();
