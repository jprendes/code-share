import { css, html, LitElement } from "lit";

import auth from "../utils/Auth.js";

import "@spectrum-web-components/progress-circle/sp-progress-circle.js";
import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/popover/sp-popover.js";
import "@spectrum-web-components/tooltip/sp-tooltip.js";
import "@spectrum-web-components/divider/sp-divider.js";

import "@spectrum-web-components/icons-workflow/icons/sp-icon-play.js";
import "@spectrum-web-components/icons-workflow/icons/sp-icon-close.js";

import redBtnStyle from "../utils/redBtnStyle.js";

class CollabLogin extends LitElement {
    static styles = css`
        :host {
            display: contents;
        }

        #container {
            display: grid;
            grid-template-rows: minmax(0, auto) 0;
            grid-template-columns: minmax(0, auto) 0;
            align-items: center;
            justify-items: center;
        }

        #glogo {
            width: 18px;
            height: 18px;
        }

        #login > #glogo {
            fill: white;
        }

        #loading {
            pointer-events: none;
        }

        #avatar {
            width: 32px;
            height: 32px;
            border-radius: 100%;
            border: 2px solid #666;
            cursor: pointer;
        }

        overlay-trigger {
            display: grid;
            align-items: center;
            justify-items: center;
        }
    `;

    constructor() {
        super();
        auth.on("loaded", this.#requestUpdate);
        auth.on("change", this.#requestUpdate);
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    // eslint-disable-next-line class-methods-use-this
    render() {
        const { user } = auth;
        let btn;

        if (auth.authorized) {
            btn = html`
                <overlay-trigger placement="bottom" offset="0">
                    <img id="avatar" slot="trigger" src=${user.photo}></img>
                    <sp-popover slot="click-content" direction="bottom" tip>
                        <div id="login-popover-content" style="text-align: center;">
                            <div id="upper-panel" style="padding: 20px 30px; text-align: center;">
                                <div style="font-weight: bold; font-size: 1.3em;">${user.name}</div>
                                <div style="font-size: 0.8em; color: #888;">${user.email}</div>
                            </div>
                            <sp-divider size="s"></sp-divider>
                            <div id="lower-panel" style="padding: 20px 30px; text-align: center;">
                                <sp-action-button id="logout"
                                    style=${redBtnStyle}
                                    quiet
                                    emphasized
                                    selected
                                    @click=${() => auth.logout()}
                                >
                                    Log-out
                                </sp-action-button>
                            </div>
                        </div>
                    </sp-popover>
                    <sp-tooltip slot="hover-content">${user.name}</sp-tooltip>
                </overlay-trigger>
            `;
        } else if (!auth.loaded) {
            btn = html`
                <sp-action-button id="loading"
                    emphasized
                    quiet
                >
                    <sp-progress-circle indeterminate id="spinner"
                        slot="icon"
                        size="s"
                    ></sp-progress-circle>
                    Loading
                </sp-action-button>
            `;
        } else {
            btn = html`
                <sp-action-button id="login"
                    quiet
                    emphasized
                    selected
                    @click=${() => auth.login()}
                >
                    <svg id="glogo" slot="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210" xml:space="preserve">
                        <path d="M0 105C0 47.103 47.103 0 105 0c23.383 0 45.515 7.523 64.004 21.756l-24.4 31.696C133.172 44.652 119.477 40 105 40c-35.841 0-65 29.159-65 65s29.159 65 65 65c28.867 0 53.398-18.913 61.852-45H105V85h105v20c0 57.897-47.103 105-105 105S0 162.897 0 105z"/>
                    </svg>
                    Log-in with Google
                </sp-action-button>
            `;
        }

        return html`
            <div id="container">${btn}</div>
        `;
    }
}

customElements.define("collab-login", CollabLogin);
