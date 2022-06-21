import { html, render } from "lit";

import "@spectrum-web-components/tooltip/sp-tooltip.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";

import "./quill-editor.js";
import Color from "color";

const style = `
    .cursor-tooltip-trigger {
        position: absolute;
        width: 0.8em;
        height: calc(100% + 3px);
        transform: translate(-50%, -2px) translateX(1px);
        pointer-events: auto;
    }
    .ql-cursor-selection-block {
        background-color: var(--remote-color, orange) !important;
        opacity: 0.15;
    }
    quill-editor:focus-within .ql-cursor-selection-block {
        opacity: 0.3;
    }
    .ql-cursor-flag {
        display: none !important;
    }
    .ql-cursor-caret {
        background-color: var(--remote-color, orange) !important;
        opacity: 0.5;
    }
    .ql-cursor-caret::after {
        position: absolute;
        content: ' ';
        border: 3px solid var(--remote-color, orange);
        border-radius: 4px;
        left: -2px;
        top: -5px;
    }
    quill-editor:focus-within .ql-cursor-caret {
        opacity: 1;
    }
    .ql-editor {
        /* caret-color: var(--local-color, black); */
    }
    .ql-editor ::selection {
        background-color: var(--local-color-alpha, #0076ff4d);
    }
`;

class YQuillEditor extends HTMLElement {
    #editor = document.createElement("quill-editor");
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
    }

    #me = null;
    get me() { return this.#me; }
    set me(me) {
        this.#me = me;
        this.#editor.style.setProperty("--local-color", me?.color || "transparent");
        this.#editor.style.setProperty("--local-color-alpha", Color(me?.color || "transparent").alpha(0.3));
    }

    #onMutation = () => {
        const cursors = this.#editor.querySelectorAll(".ql-cursor");
        this.#cursors = new Set(cursors);
        this.#styleCursors();
    };

    #cursors = new Set();
    #styleCursors = () => {
        for (const cursor of this.#cursors) {
            const id = cursor.id.replace("ql-cursor-", "");
            if (!id) continue;

            const client = this.#clients[id];
            if (!client) continue;

            cursor.style.setProperty("--remote-color", `${client.color || "transparent"}`);

            const caret = cursor.querySelector(".ql-cursor-caret");
            if (!caret) return;

            render(html`
                <overlay-trigger placement="bottom" offset="0">
                    <div class="cursor-tooltip-trigger" slot="trigger" @click=${() => this.#onCursorClick(id)}>
                    </div>
                    <sp-tooltip open slot="hover-content" style="white-space: nowrap;">
                        ${client.username || "Unknown"}
                        ${client.me ? "(You)" : ""}
                    </sp-tooltip>
                </overlay-trigger>
            `, caret);
        }
    };

    #onCursorClick = (id) => {
        const cursor = this.#editor.editor.getModule("cursors").cursors().find((c) => c.id === id);
        if (!cursor) return;
        this.#editor.editor.setSelection(cursor.range.index + cursor.range.length, 0);
    };

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

customElements.define("y-quill-editor", YQuillEditor);
