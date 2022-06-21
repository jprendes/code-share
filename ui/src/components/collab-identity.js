import { LitElement, html, css } from "lit";

import "@spectrum-web-components/tooltip/sp-tooltip.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";

class CollabIdentity extends LitElement {
    static styles = css`
        .client {
            width: 10px;
            height: 10px;
            border-radius: 100%;
            border: 2px solid;
        }

        .client:not(:first-of-type) {
            margin-left: 2px;
        }

        .group {
            display: flex;
            flex-direction: row;
            margin-left: 10px;
            padding-bottom: 2px;
            padding-top: 4px;
            position: relative;
        }
    `;

    static properties = {
        identity: { type: Object },
    };

    render() {
        return html`
            <overlay-trigger placement="bottom" offset="0">
                <div class="group" slot="trigger">
                    <div class="client"
                        style="
                            background-color: ${this.identity.color};
                            border-color: ${this.identity.color.darken(0.5).alpha(0.5)};
                        "
                    ></div>
                </div>
                <sp-tooltip open slot="hover-content" style="white-space: nowrap;">
                    ${this.identity.username || ""} ${this.identity.me ? "(You)" : ""}
                </sp-tooltip>
            </overlay-trigger>
        `;
    }
}

customElements.define("collab-identity", CollabIdentity);
