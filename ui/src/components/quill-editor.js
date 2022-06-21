import Quill from "quill";
import QuillCursors from "quill-cursors";

import highlight from "highlight.js/lib/core";

import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

import highlightC from "highlight.js/lib/languages/c.js";
import highlightCpp from "highlight.js/lib/languages/cpp.js";
import highlightRust from "highlight.js/lib/languages/rust.js";
import "highlight.js/styles/vs.css";

import "./select-css.css";

const Syntax = Quill.imports["modules/syntax"];
Syntax.DEFAULTS.hljs = {
    highlight: (lang, text) => highlight.highlight(lang, text).value,
};
Syntax.DEFAULTS.languages = [
    { key: "plain", label: "Plain" },
    { key: "c", label: "C" },
    { key: "cpp", label: "C++" },
    { key: "rust", label: "Rust" },
];

Quill.register("modules/cursors", QuillCursors);

highlight.registerLanguage("c", highlightC);
highlight.registerLanguage("cpp", highlightCpp);
highlight.registerLanguage("rs", highlightRust);

class QuillEditor extends HTMLElement {
    #editor = null;
    #container = document.createElement("div");
    #subcontainer = document.createElement("div");

    #init = () => {
        this.#init = null;

        const style = document.createElement("style");
        style.textContent = `
            quill-editor > div {
                display: grid;
                grid-template-rows: minmax(0, auto) minmax(0, 1fr);
                height: 100%;
                width: 100%;
                background: white;
            }
            .ql-snow .ql-editor pre.ql-syntax, /* quill 1.x */
            .ql-snow .ql-editor .ql-code-block-container /* quill 2.x */ {
                background-color: #f8f8f2;
                color: #23241f;
                overflow: visible;
            }
        `;
        this.appendChild(style);
        this.appendChild(this.#container);
        this.#container.appendChild(this.#subcontainer);
        this.#editor = new Quill(this.#subcontainer, {
            modules: {
                syntax: true,
                cursors: true,
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ color: [] }, { background: [] }],
                    [{ list: "ordered" }, { list: "bullet" }, { align: [] }],
                    [{ indent: "-1" }, { indent: "+1" }],
                    ["link", "image", "code-block"],
                ],
                history: {
                    userOnly: true,
                },
            },
            placeholder: "Start collaborating...",
            theme: "snow",
        });
    };

    get editor() {
        this.#init?.();
        return this.#editor;
    }

    connectedCallback() {
        this.#init?.();
    }

    disconnectedCallback() {
        this.#init?.();
    }
}

customElements.define("quill-editor", QuillEditor);
