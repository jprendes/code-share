import { css, html, LitElement } from "lit";

import "@spectrum-web-components/progress-circle/sp-progress-circle.js";
import "@spectrum-web-components/action-button/sp-action-button.js";

import "@spectrum-web-components/icons-workflow/icons/sp-icon-play.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-close.js";
import redBtnStyle from "../utils/redBtnStyle.js";

class CollabCompileBtn extends LitElement {
    static styles = css`
        #compiling {
            display: grid;
            grid-template-columns: auto auto auto;
            align-items: center;
            gap: 5px;
        }
        #cancel {
            margin-left: 10px;
            --spectrum-actionbutton-m-emphasized-textonly-background-color-selected: var( --spectrum-button-m-negative-fill-texticon-background-color,var(--spectrum-global-color-static-red-600) );
            --spectrum-actionbutton-m-emphasized-textonly-border-color-selected: var( --spectrum-button-m-primary-fill-texticon-border-color,transparent );
            --spectrum-actionbutton-m-emphasized-textonly-background-color-selected-hover: var( --spectrum-button-m-negative-fill-texticon-background-color-hover,var(--spectrum-global-color-static-red-700) );
            --spectrum-actionbutton-m-emphasized-textonly-border-color-selected-hover: var( --spectrum-button-m-primary-fill-texticon-border-color,transparent );
            --spectrum-actionbutton-m-emphasized-textonly-background-color-selected-down: var( --spectrum-button-m-negative-fill-texticon-background-color-down,var(--spectrum-global-color-static-red-800) );
            --spectrum-actionbutton-m-emphasized-textonly-border-color-selected-down: var( --spectrum-button-m-primary-fill-texticon-border-color,transparent );
            --spectrum-actionbutton-m-emphasized-textonly-background-color-selected-key-focus: var( --spectrum-button-m-negative-fill-texticon-background-color-key-focus,var(--spectrum-global-color-static-red-700) );
            --spectrum-actionbutton-m-emphasized-textonly-border-color-selected-key-focus: var( --spectrum-button-m-primary-fill-texticon-border-color,transparent );
        }
        #not-ready {
            display: grid;
            grid-template-columns: auto auto;
            gap: 10px;
            align-items: center;
            padding: 5px;
        }
    `;

    static properties = {
        room: { type: Object },
        ready: { type: Boolean },
        compiling: { type: Boolean },
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        if (room === this.#room) return;

        this.#room?.off("compiling", this.#requestUpdate);
        this.#room?.off("ready", this.#requestUpdate);
        this.#room?.off("disconnected", this.#requestUpdate);

        this.#room = room;
        this.#room?.on("compiling", this.#requestUpdate);
        this.#room?.on("ready", this.#requestUpdate);
        this.#room?.on("disconnected", this.#requestUpdate);
        this.#requestUpdate();
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    #onCompileClick = () => {
        this.#room?.compile();
    };

    #onCancelClick = () => {
        this.#room?.cancelCompilation();
    };

    render() {
        if (!this.#room.isReady) {
            return html`
                <div id="not-ready">
                    <sp-progress-circle indeterminate
                        slot="icon"
                        size="s"
                    ></sp-progress-circle>
                    Connecting...
                </div>
            `;
        }

        if (this.#room.compiling || this.#room.queued) {
            return html`
                <div id="compiling">
                    <sp-progress-circle indeterminate id="spinner"
                        slot="icon"
                        size="s"
                    ></sp-progress-circle>
                    ${!this.#room.queued ? "Running..." : "Queued..."}
                    <sp-action-button id="cancel"
                        style=${redBtnStyle}
                        quiet
                        emphasized
                        selected
                        @click=${this.#onCancelClick}
                    >
                        <sp-icon-close slot="icon"></sp-icon-close>
                    </sp-action-button>
                </div>
            `;
        }

        return html`
            <sp-action-button id="compile"
                quiet
                emphasized
                selected
                @click=${this.#onCompileClick}
            >
                <sp-icon-play slot="icon"></sp-icon-play>
                Run
            </sp-action-button>
        `;
    }
}

customElements.define("collab-compile-btn", CollabCompileBtn);
