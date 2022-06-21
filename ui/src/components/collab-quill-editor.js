import "./y-quill-editor.js";

class CollabQuillEditor extends HTMLElement {
    #editor = document.createElement("y-quill-editor");

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

        this.#room = room;
        this.#room?.on("clients", this.#onClients);

        this.#bind();
        this.#onClients();
    }

    #onClients = () => {
        this.#editor.clients = this.#room.clients;
        this.#editor.me = this.#room.me;
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
            this.#unbindFcn = this.#room?.bindTextEditor("text", this.#editor.editor);
        }
    };
}

customElements.define("collab-quill-editor", CollabQuillEditor);
