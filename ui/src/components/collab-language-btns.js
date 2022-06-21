import { LitElement, html, css } from "lit";

class CollabLanguageBtns extends LitElement {
    static styles = css`
    `;

    static properties = {
        room: { type: Object },
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        if (room === this.#room) return;

        this.#room?.off("language", this.#requestUpdate);
        this.#room?.off("compiling", this.#requestUpdate);
        this.#room?.off("ready", this.#requestUpdate);
        this.#room?.off("disconnected", this.#requestUpdate);

        this.#room = room;
        this.#room?.on("language", this.#requestUpdate);
        this.#room?.on("compiling", this.#requestUpdate);
        this.#room?.on("ready", this.#requestUpdate);
        this.#room?.on("disconnected", this.#requestUpdate);
        this.#requestUpdate();
    }

    #requestUpdate = () => {
        this.requestUpdate();
    };

    #onLanguageClick = (language) => {
        this.#room.language = language;
    };

    render() {
        const options = [
            ["c", "C"],
            ["cpp", "C++"],
            ["rust", "Rust"],
        ];

        const disabled = !this.#room?.isReady
            || !this.#room?.language
            || this.#room?.compiling
            || this.#room?.queued;

        const btns = options.map(([id, text]) => html`
            <sp-action-button quiet
                ?disabled=${disabled}
                ?selected=${id === this.#room?.language}
                @click=${() => this.#onLanguageClick(id)}
            >
                ${text}
            </sp-action-button>
        `);

        return html`
            <sp-quick-actions opened text-only ?disabled=${disabled}>
                ${btns}
            </sp-quick-actions>
        `;
    }
}

customElements.define("collab-language-btns", CollabLanguageBtns);
