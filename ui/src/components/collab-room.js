import {
    LitElement, html, css,
} from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import Split from "split-grid";

import "@spectrum-web-components/styles/all-medium-lightest.css";

import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/toast/sp-toast.js";

import "./collab-identities-list.js";
import "./collab-compile-btn.js";
import "./collab-language-btns.js";

import favicon from "../../favicon.svg";

class CollabRoom extends LitElement {
    static styles = css`
        #room {
            display: grid;
            width: 100%;
            height: 100%;
            grid-template-rows: auto minmax(0, 1fr);
            grid-template-columns: 100%;
            padding: 10px;
            box-sizing: border-box;
        }

        #header {
            padding-bottom: 10px;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
        }

        #room-icon {
            padding-right: 10px;
            display: grid;
            align-items: center;
            justify-items: center;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
        }

        #room-name {
            font-size: 2em;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        #content {
            display: grid;
            grid-template-rows: 3fr 10px 2fr;
            grid-template-columns: 1fr 10px 1fr;
        }

        #text,
        #code,
        #term {
            overflow: hidden;
        }

        #text {
            grid-colum: 1 / 2;
            grid-row: 1 / 4;
            grid-template-rows: 1fr auto;
            grid-template-columns: 100%;
        }

        #code {
            grid-colum: 3 / 4;
            grid-row: 1 / 2;
            display: grid;
            grid-template-rows: minmax(0, auto) minmax(0, 1fr);
            grid-template-columns: 100%;
        }

        #term {
            grid-colum: 3 / 4;
            grid-row: 3 / 4;
        }

        #v-splitter,
        #h-splitter {
            background: transparent;
            position: relative;
        }

        #v-splitter:hover,
        #h-splitter:hover {
            background: #ddd;
        }

        #v-splitter {
            cursor: col-resize;
            grid-colum: 2 / 3;
            grid-row: 1 / 4;
        }

        #h-splitter {
            cursor: row-resize;
            grid-colum: 1 / 4;
            grid-row: 2 / 3;
        }

        #code-header {
            padding: 10px;
            display: grid;
            grid-template-columns: 1fr minmax(0, auto);
            border: 1px solid #ccc;
            border-bottom: none;
            align-items: center;
            background: white;
        }

        #toast-container {
            display: grid;
            pointer-events: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            justify-items: center;
            padding: 2px;
        }

        #toast-container > * {
            pointer-events: all;
        }

        #v-splitter::after,
        #h-splitter::after {
            content: " ";
            display: block;
            background: #ccc;
            width: 6px;
            height: 6px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 3px;
        }

        #v-splitter:hover::after,
        #h-splitter:hover::after {
            background: #aaa;
        }

        #v-splitter::after {
            height: 30px;
        }

        #h-splitter::after {
            width: 30px;
        }
    `;

    static properties = {
        room: { type: Object },
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        if (room === this.#room) return;

        this.#room?.off("status", this.#requestUpdate);
        this.#room?.off("compiling", this.#requestUpdate);

        this.#room = room;

        this.#room?.on("status", this.#requestUpdate);
        this.#room?.on("compiling", this.#requestUpdate);
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    #vSplitter = document.createElement("div");
    #hSplitter = document.createElement("div");
    firstUpdated() {
        this.#vSplitter.id = "v-splitter";
        this.#hSplitter.id = "h-splitter";
        Split({
            gridTemplateColumns: "1fr 10px 1fr",
            gridTemplateRows: "3fr 10px 2fr",
            columnGutters: [{
                track: 1,
                element: this.#vSplitter,
            }],
            rowGutters: [{
                track: 1,
                element: this.#hSplitter,
            }],
            columnMinSizes: {
                0: 250,
                2: 300,
            },
            rowMinSizes: {
                0: 300,
                2: 200,
            },
        });
    }

    render() {
        return html`
            <sp-theme scale="medium" color="lightest">
            <div id="room">
                <div id="header">
                    <div id="room-icon">
                        ${unsafeHTML(favicon)}
                    </div>
                    <div id="room-name">${this.#room?.name || ""}</div>
                    <collab-identities-list .room=${this.#room}></collab-identities-list>
                </div>
                <div id="content">
                    <div id="text">
                        <slot name="text"></slot>
                    </div>
                    ${this.#vSplitter}
                    <div id="code">
                        <div id="code-header">
                            <collab-language-btns .room=${this.#room}></collab-language-btns>
                            <collab-compile-btn .room=${this.#room}></collab-compile-btn>
                        </div>
                        <slot name="code"></slot>
                    </div>
                    ${this.#hSplitter}
                    <div id="term">
                        <slot name="term"></slot>
                    </div>
                </div>
            </div>
            <div id="toast-container">
                <sp-toast
                    ?open=${!this.#room.isReady}
                    variant="negative"
                >
                    Can't connect to server.
                </sp-toast>
                <sp-toast
                    ?open=${this.#room.isReady && this.#room.queued}
                    variant="info"
                >
                    The code is queued for execution.
                </sp-toast>
            </div>
            </sp-theme>
        `;
    }
}

customElements.define("collab-room", CollabRoom);
