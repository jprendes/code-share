import { LitElement, html, css } from "lit";

import "@spectrum-web-components/progress-circle/sp-progress-circle.js";

class CollabLoading extends LitElement {
    static styles = css`
        #loading {
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: auto;
            align-items: center;
            justify-items: center;       
            width: 100%;
            height: 100%;     
        }
        #loading > div {
            display: grid;
            grid-template-rows: auto auto;
            grid-template-columns: auto;
            align-items: center;
            justify-items: center;
            gap: 10px;
            font-size: 1.6em;
        }
    `;

    static properties = {
        size: { type: String, reflect: true },
    };

    constructor() {
        super();
        this.size = "l";
    }

    render() {
        return html`
            <div id="loading">
                <div>
                    <sp-progress-circle indeterminate id="spinner"
                        slot="icon"
                        size=${this.size}
                    ></sp-progress-circle>
                    <div>
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("collab-loading", CollabLoading);
