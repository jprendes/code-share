import "./y-monaco-editor.js";

class CollabMonacoEditor extends HTMLElement {
    #editor = document.createElement("y-monaco-editor");

    createRenderRoot() {
        return this;
    }

    #init = () => {
        this.#init = null;
        this.appendChild(this.#editor);
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        this.#init?.();

        if (room === this.#room) return;

        this.#unbind();

        this.#room?.off("clients", this.#onClients);
        this.#room?.off("language", this.#onLanguage);

        this.#room = room;
        this.#room?.on("clients", this.#onClients);
        this.#room?.on("language", this.#onLanguage);

        this.#bind();
        this.#onClients();
        this.#onLanguage();
    }

    #onClients = () => {
        this.#editor.clients = this.#room.clients;
        this.#editor.me = this.#room.me;
    };

    #onLanguage = () => {
        this.#editor.language = this.#room.language || "c";
    };

    connectedCallback() {
        this.#init?.();
        this.#bind();
    }

    disconnectedCallback() {
        this.#init?.();
        this.#unbind();
    }

    #unbindFcn = null;
    #unbind = () => {
        this.#unbindFcn?.();
        this.#unbindFcn = null;
    };

    #bind = () => {
        this.#unbind();
        if (this.isConnected) {
            this.#unbindFcn = this.#room?.bindCodeEditor("code", this.#editor.editor);
        }
    };
}

customElements.define("collab-monaco-editor", CollabMonacoEditor);
