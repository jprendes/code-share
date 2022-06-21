import "./xterm-js.js";

class CollabXtermJs extends HTMLElement {
    #term = document.createElement("xterm-js");

    createRenderRoot() {
        return this;
    }

    #init = () => {
        this.#init = null;
        this.appendChild(this.#term);
    };

    #room = null;
    get room() { return this.#room; }
    set room(room) {
        this.#init?.();

        if (room === this.#room) return;

        this.#room?.off("compiling", this.#onCompiling);

        this.#room = room;
        this.#room?.on("compiling", this.#onCompiling);

        this.#onCompiling({
            status: "started",
            data: this.#room?.compileOutput || "",
        });
    }

    #onCompiling = ({
        clear = false, data = "",
    }) => {
        if (clear) {
            this.#term.terminal.clear();
        }
        if (data) {
            this.#term.terminal.write(data.replace(/\n/g, "\r\n"));
        }
        if (this.#room?.queued) {
            this.#term.style.opacity = 0.6;
        } else {
            this.#term.style.opacity = 1;
        }
    };

    connectedCallback() {
        this.#init?.();
    }

    disconnectedCallback() {
        this.#init?.();
    }
}

customElements.define("collab-xterm-js", CollabXtermJs);
