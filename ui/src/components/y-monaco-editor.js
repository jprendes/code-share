import { html, render } from "lit";

import "@spectrum-web-components/tooltip/sp-tooltip.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";

import "./monaco-editor.js";

const style = `
    .yRemoteSelection {
        background-color: var(--remote-color, orange);
        opacity: 0.15;
        min-width: 3px;
    }
    .monaco-editor.focused .yRemoteSelection {
        opacity: 0.3;
    }
    .yRemoteCursor {
        position: absolute;
        border-left: var(--remote-color, orange) solid 2px;
        border-top: var(--remote-color, orange) solid 2px;
        border-bottom: var(--remote-color, orange) solid 2px;
        height: 100%;
        box-sizing: border-box;
        opacity: 0.5;
    }
    .yRemoteCursor::after {
        position: absolute;
        content: ' ';
        border: 3px solid var(--remote-color, orange);
        border-radius: 4px;
        left: -4px;
        top: -5px;
    }
    .monaco-editor.focused .yRemoteCursor {
        opacity: 1;
    }

    monaco-editor .monaco-editor .selected-text {
        background-color: var(--local-color, #0076ff) !important;
        opacity: 0.15;
    }
    monaco-editor .monaco-editor .focused .selected-text {
        background-color: var(--local-color, #0076ff) !important;
        opacity: 0.3;
    }
`;

class YMonacoEditor extends HTMLElement {
    #editor = document.createElement("monaco-editor");
    #style = document.createElement("style");
    #mutationObserver = null;

    #init = () => {
        this.#init = null;

        this.#style.textContent = style;
        this.appendChild(this.#style);
        this.appendChild(this.#editor);

        this.#mutationObserver = new MutationObserver(this.#onMutation);
        this.#mutationObserver.observe(this.#editor, {
            subtree: true,
            childList: true,
        });

        this.#onMutation();
    };

    #clients = {};
    get clients() { return this.#clients; }
    set clients(clients) {
        this.#clients = clients;
        this.#styleCursors();
        this.#styleSelections();
    }

    #me = null;
    get me() { return this.#me; }
    set me(me) {
        this.#me = me;
        this.#editor.style.setProperty("--local-color", me?.color || "transparent");
    }

    #onMutation = () => {
        const cursors = this.#editor.querySelectorAll(".yRemoteCursor");
        this.#cursors = new Set(cursors);
        this.#styleCursors();

        const selections = this.#editor.querySelectorAll(".yRemoteSelection");
        this.#selections = new Set(selections);
        this.#styleSelections();
    };

    #cursors = new Set();
    #styleCursors = () => {
        for (const cursor of this.#cursors) {
            const id = [...cursor.classList]
                .find((c) => c.startsWith("yRemoteCursor-"))
                ?.replace("yRemoteCursor-", "");
            if (!id) continue;

            const client = this.#clients[id];
            if (!client) continue;

            cursor.style.setProperty("--remote-color", `${client.color || "transparent"}`);
            render(html`
                <overlay-trigger placement="bottom" offset="0">
                    <div class="cursor-tooltip-trigger" slot="trigger">
                    </div>
                    <sp-tooltip open slot="hover-content" style="white-space: nowrap;">
                        ${client.username || "Unknown"}
                        ${client.me ? "(You)" : ""}
                    </sp-tooltip>
                </overlay-trigger>
            `, cursor);
        }
    };

    #selections = new Set();
    #styleSelections = () => {
        for (const selection of this.#selections) {
            const id = [...selection.classList]
                .find((c) => c.startsWith("yRemoteSelection-"))
                ?.replace("yRemoteSelection-", "");
            if (!id) continue;

            const client = this.#clients[id];
            if (!client) continue;

            selection.style.setProperty("--remote-color", `${client.color || "transparent"}`);
        }
    };

    get language() {
        this.#init?.();
        return this.#editor.language;
    }

    set language(language) {
        this.#init?.();
        this.#editor.language = language;
    }

    get editor() {
        this.#init?.();
        return this.#editor.editor;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        this.#init?.();
    }
}

customElements.define("y-monaco-editor", YMonacoEditor);
