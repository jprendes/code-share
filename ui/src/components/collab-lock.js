import { LitElement, html } from "lit";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-lock-closed.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-lock-open.js";
import "@spectrum-web-components/tooltip/sp-tooltip.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";

import "./collab-login.js";

class CollabLock extends LitElement {
    static properties = {
        room: { type: Object },
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        if (room === this.#room) return;

        this.#room?.off("visibility", this.#requestUpdate);
        this.#room?.off("status", this.#requestUpdate);

        this.#room = room;
        this.#room?.on("visibility", this.#requestUpdate);
        this.#room?.on("status", this.#requestUpdate);

        this.#requestUpdate();
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    #makePrivate = () => {
        if (!this.#room) return;
        this.#room.visibility = "private";
    };

    #makePublic = () => {
        if (!this.#room) return;
        this.#room.visibility = "public";
    };

    render() {
        const enabled = this.#room?.isReady;
        const visibility = this.#room?.visibility || "public";

        if (visibility === "private") {
            return html`
                <overlay-trigger placement="bottom" offset="0">
                    <sp-action-button slot="trigger"
                        size="s"
                        ?disabled=${!enabled}
                        @click=${this.#makePublic}
                    >
                        <sp-icon-lock-closed slot="icon"></sp-icon-lock-closed>
                    </sp-action-button>
                    <sp-tooltip slot="hover-content">
                        This room is <b>private</b>.<br>
                        Click here to make it public.
                    </sp-tooltip>
                </overlay-trigger>
            `;
        }

        return html`
            <overlay-trigger placement="bottom" offset="0">
                <sp-action-button slot="trigger"
                    size="s"
                    ?disabled=${!enabled}
                    @click=${this.#makePrivate}
                >
                    <sp-icon-lock-open slot="icon"></sp-icon-lock-open>
                </sp-action-button>
                <sp-tooltip slot="hover-content">
                    This room is <b>public</b>.<br>
                    Click here to make it private.
                </sp-tooltip>
            </overlay-trigger>
        `;
    }
}

customElements.define("collab-lock", CollabLock);
