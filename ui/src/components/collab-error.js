/* eslint-disable camelcase */
import { LitElement, html, css } from "lit";

import sentiment_dissatisfied from "@material-icons/svg/svg/sentiment_dissatisfied/round.svg";
import face from "@material-icons/svg/svg/face/round.svg";
import person from "@material-icons/svg/svg/person/round.svg";
import warning from "@material-icons/svg/svg/warning/round.svg";
import error from "@material-icons/svg/svg/error/round.svg";
import report from "@material-icons/svg/svg/report/round.svg";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

class CollabError extends LitElement {
    static ICONS = {
        sentiment_dissatisfied,
        face,
        person,
        warning,
        error,
        report,
    };

    static styles = css`
        :host {
            display: contents;
        }

        #error-page {
            display: grid;
            width: 580px;
            color: #333;
            grid-template-rows: auto;
            grid-template-columns: 140px 1fr;
            grid-template-areas:
                "icon title"
                "icon subtitle"
                "icon message"
                "icon action";
            column-gap: 10px;
            padding: 10px;
            box-sizing: border-box;
            justify-self: center;
            align-self: center;
        }

        #icon {
            grid-area: icon;
            width: 140px;
            height: 140px;
        }

        #icon>svg {
            width: 100%;
            height: 100%;
            fill: #333;
        }

        #title {
            grid-area: title;
            font-size: 65px;
            font-weight: bold;
        }

        #subtitle {
            grid-area: subtitle;
            font-size: 20px;
        }

        #message {
            grid-area: message;
            color: #AAA;
            margin: 14px 0;
        }

        #action {
            grid-area: action;
            font-weight: bold;
            display: grid;
            grid-template-columns: minmax(0, auto) 0;
            grid-template-rows: minmax(0, auto) 0;
            align-items: start;
            justify-items: start;
        }

        a {
            text-decoration: none;
            color: #49C;
        }

        a:hover,
        a:active {
            color: #38B;
        }
        html,
        body {
            width: 100%;
        }


        @media only screen and (max-width: 580px) {
            #error-page {
                width: 100%;
                grid-template-rows: auto;
                grid-template-columns: 100%;
                grid-template-areas:
                    "icon"
                    "title"
                    "subtitle"
                    "message"
                    "action";
                text-align: center;
                justify-items: center;
            }

            #action {
                align-items: center;
                justify-items: center;
            }
        }
    `;

    static properties = {
        icon: { type: String, reflect: true },
        code: { type: String, reflect: true },
        status: { type: String, reflect: true },
        message: { type: String, reflect: true },
    };

    render() {
        const {
            icon = "sentiment_dissatisfied",
            code = "",
            status = "",
            message = "",
        } = this;

        const svg = CollabError.ICONS[icon];

        return html`
            <div id="error-page">
                <div id="icon">
                    ${unsafeHTML(svg)}
                </div>
                <div id="title">${code}</div>
                <div id="subtitle">${status}</div>
                <div id="message">${message}</div>
                <div id="action">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

customElements.define("collab-error", CollabError);
