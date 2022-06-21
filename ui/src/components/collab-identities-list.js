import { LitElement, html, css } from "lit";

import "./collab-identity.js";

class CollabIdentitiesList extends LitElement {
    static styles = css`
        #container {
            display: grid;
            grid-template-rows: auto auto;
            grid-tempalte-columns: 100%;
            justify-items: end;
            padding: 0 10px;
        }

        #clients {
            display: flex;
            flex-direction: row;
        }
    `;

    static properties = {
        room: { type: Object },
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        if (room === this.#room) return;

        this.#room?.off("clients", this.#requestUpdate);

        this.#room = room;
        this.#room?.on("clients", this.#requestUpdate);
        this.#requestUpdate();
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    render() {
        const { me, others } = this.room;

        const identities = [...others, me].filter(Boolean);

        return html`
            <div id="container">
                <div>
                    ${identities.length} collaborators
                </div>
                <div id="clients">
                    ${identities.map((identity) => html`
                        <collab-identity .identity=${identity}></collab-identity>
                    `)}
                </div>
            </div>
        `;
    }
}

customElements.define("collab-identities-list", CollabIdentitiesList);
