import { LitElement, html } from "lit";

import auth from "../utils/Auth.js";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-more-small-list-vert.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";

import "./collab-login.js";

class CollabUser extends LitElement {
    constructor() {
        super();
        auth.on("change", this.#requestUpdate);
        auth.on("loaded", this.#requestUpdate);
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    // eslint-disable-next-line class-methods-use-this
    render() {
        if (auth.authorized) {
            return html`
                <collab-login></collab-login>
            `;
        }
        return html`
            <overlay-trigger placement="bottom" offset="0">
                <sp-action-button size="m" slot="trigger">
                    <sp-icon-more-small-list-vert slot="icon"></sp-icon-more-small-list-vert>
                </sp-action-button>
                <sp-popover slot="click-content" direction="bottom" tip>
                    <div id="upper-panel" style="padding: 20px 30px; text-align: center;">
                        <collab-login></collab-login>
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
    }
}

customElements.define("collab-user", CollabUser);
