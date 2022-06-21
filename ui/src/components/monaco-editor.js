import * as monaco from "monaco-editor";

class MonacoEditor extends HTMLElement {
    #editor = null;
    #resizeObserver = null;
    #mutationObserver = null;
    #container = document.createElement("div");
    #cursors = new Set();
    #selections = new Set();

    #init = () => {
        this.#init = null;

        const style = document.createElement("style");
        style.textContent = `
            monaco-editor > div {
                height: 100%;
                width: 100%;
                border: 1px solid #ccc;
                box-sizing: border-box;
                overflow: hidden;
            }
        `;
        this.appendChild(style);
        this.appendChild(this.#container);
        this.#editor = monaco.editor.create(this.#container, {
            value: "",
            language: "cpp",
        });
        this.#resizeObserver = new ResizeObserver(this.#onResize);
        this.#mutationObserver = new MutationObserver(() => {
            this.#updateCursors();
            this.#updateSelections();
        });
        this.#mutationObserver.observe(this.#container, {
            subtree: true,
            childList: true,
        });
    };

    #updateCursors = () => {
        const cursors = this.#container.querySelectorAll(".yRemoteCursor");
        let modified = false;
        for (const cursor of this.#cursors) {
            if (!this.#container.contains(cursor)) {
                this.#cursors.delete(cursor);
                modified = true;
            }
        }
        for (const cursor of cursors) {
            if (!this.#cursors.has(cursor)) {
                this.#cursors.add(cursor);
                modified = true;
            }
        }
        if (modified) {
            this.dispatchEvent(new CustomEvent("cursors-change", {
                detail: new Set([...this.#cursors]),
            }));
        }
    };

    #updateSelections = () => {
        const selections = this.#container.querySelectorAll(".yRemoteSelection");
        let modified = false;
        for (const selection of this.#selections) {
            if (!this.#container.contains(selection)) {
                this.#selections.delete(selection);
                modified = true;
            }
        }
        for (const selection of selections) {
            if (!this.#selections.has(selection)) {
                this.#selections.add(selection);
                modified = true;
            }
        }
        if (modified) {
            this.dispatchEvent(new CustomEvent("selections-change", {
                detail: new Set([...this.#selections]),
            }));
        }
    };

    get language() {
        this.#init?.();
        return this.editor.getModel().getLanguageId();
    }

    set language(language) {
        this.#init?.();
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
    }

    get editor() {
        this.#init?.();
        return this.#editor;
    }

    createRenderRoot() {
        return this;
    }

    #onResize = () => {
        this.#editor.layout();
    };

    connectedCallback() {
        this.#init?.();
        this.#resizeObserver.observe(this.#container);
        this.#onResize();
    }

    disconnectedCallback() {
        this.#init?.();
        this.#resizeObserver.disconnect();
    }
}

customElements.define("monaco-editor", MonacoEditor);
