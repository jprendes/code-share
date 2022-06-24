import { LitElement, css, html } from "lit";

import { match } from "path-to-regexp";

import Room from "./model/Room.js";

import auth from "./utils/Auth.js";

import StateMachine from "./utils/StateMachine.js";

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

class CodeShare extends LitElement {
    static styles = css`
        collab-room,
        #loading {
            grid-column: 1 / 2;
            grid-row: 1 / 2;
        }
    `;

    createRenderRoot() {
        // Render in light DOM.
        // This is needed to render the monaco editor.
        const style = document.createElement("style");
        style.textContent = CodeShare.styles.toString();
        this.appendChild(style);

        const container = document.createElement("div");
        container.style.display = "contents";
        this.appendChild(container);

        this.style.display = "contents";

        return container;
    }

    constructor() {
        super();
        this.#machine.start();
    }

    #machine = new StateMachine({
        start: async (next) => {
            this.#renderLoading();

            const name = getRoomName();
            this.#machine.context.name = name;

            if (!name) {
                return next("wait-auth");
            }

            if (!await hasRoom(name)) {
                return next("wait-auth");
            }

            return next("load-room");
        },
        "wait-auth": async (next) => {
            await auth;
            next("auth");
        },
        auth: async (next) => {
            if (auth.authorized) return next("load-room");

            auth.once("login", () => next("load-room"));

            this.#renderLogin();

            return null;
        },
        "load-room": async (next) => {
            this.#renderLoading();

            const { name } = this.#machine.context;
            if (!name) return next("create-room");

            return next("show-room");
        },
        "create-room": async (next) => {
            try {
                const name = await makeRoomName();
                this.#machine.context.name = name;
                next("show-room");
            } catch (err) {
                this.#machine.context.error = err;
                next("create-error");
            }
        },
        "show-room": async (next) => {
            const server = `${global.location.protocol === "http:" ? "ws:" : "wss:"}//${global.location.host}/doc/`;
            const { name } = this.#machine.context;
            const room = new Room(server, name);

            await room.ready;

            this.#renderRoom(room);

            next();
        },
        "create-error": async (next) => {
            this.#renderError("Error trying to create a new room");
            next();
        },
    });

    #template = html``;
    render() {
        return this.#template;
    }

    #render = (template) => {
        this.#template = template;
        this.requestUpdate();
    };

    // eslint-disable-next-line class-methods-use-this
    #renderLoading = () => this.#render(html`<collab-loading>Loading...</collab-loading>`);

    // eslint-disable-next-line class-methods-use-this
    #renderLogin = () => this.#render(html`
        <collab-error
            icon="person"
            code="hi!"
            status="Log-in required"
            message="You must be logged in to create new rooms"
        >
            <collab-login></collab-login>
        </collab-error>
    `);

    // eslint-disable-next-line class-methods-use-this
    #renderError = (message = "Error trying to create a new room") => this.#render(html`
        <collab-error
            icon="sentiment_dissatisfied"
            code="oops!"
            status="Something went wrong"
            message=${message}
        >
            <a href="javascript:window.location.href=window.location.href">Try again</a>
        </collab-error>
    `);

    // eslint-disable-next-line class-methods-use-this
    #renderRoom = (room) => this.#render(html`
        <collab-room .room=${room}>
            <collab-monaco-editor slot="code" .room=${room}></collab-monaco-editor>
            <collab-quill-editor slot="text" .room=${room}></collab-quill-editor>
            <collab-xterm-js slot="term" .room=${room}></collab-xterm-js>
        </collab-room>
    `);
}

customElements.define("code-share", CodeShare);
