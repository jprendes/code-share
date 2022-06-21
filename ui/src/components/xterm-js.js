import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import Color from "color";

import "xterm/css/xterm.css";

const ANSI_COLORS = {
    black: Color("#000000").darken(0.2),
    red: Color("#cc0000").darken(0.2),
    green: Color("#4e9a06").darken(0.2),
    yellow: Color("#c4a000").darken(0.2),
    blue: Color("#729fcf").darken(0.2),
    magenta: Color("#75507b").darken(0.2),
    cyan: Color("#06989a").darken(0.2),
    white: Color("#d3d7cf").darken(0.2),
    brightBlack: Color("#000000").lighten(0.2),
    brightRed: Color("#cc0000").lighten(0.2),
    brightGreen: Color("#4e9a06").lighten(0.2),
    brightYellow: Color("#c4a000").lighten(0.2),
    brightBlue: Color("#729fcf").lighten(0.2),
    brightMagenta: Color("#75507b").lighten(0.2),
    brightCyan: Color("#06989a").lighten(0.2),
    brightWhite: Color("#d3d7cf").lighten(0.2),
};

class XtermJs extends HTMLElement {
    #terminal = null;
    #fitAddon = null;
    #resizeObserver = null;
    #container = document.createElement("div");

    #init = () => {
        this.#init = null;

        const style = document.createElement("style");
        style.textContent = `
            xterm-js > div {
                border: 1px solid #ccc;
            }

            xterm-js > div,
            xterm-js > div > .terminal.xterm {
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                overflow: hidden;
            }

            xterm-js .xterm .xterm-viewport {
                width: 100% !important;
                height: 100% !important;
            }

            xterm-js * {
                scrollbar-color:
                    var(--scrollbar-foreground, #ccc)
                    var(--scrollbar-background, transparent);
            }
            
            xterm-js *::-webkit-scrollbar {
                width: 14px;
                height: 14px;
            }

            xterm-js *::-webkit-scrollbar-thumb {
                background: var(--scrollbar-foreground, #ccc);
            }
            
            xterm-js *::-webkit-scrollbar-track {
                background: var(--scrollbar-backgroundm, transparent);
            }
        `;
        this.appendChild(style);
        this.appendChild(this.#container);
        this.#terminal = new Terminal({
            disableStdin: true,
            cursorStyle: "underline",
            theme: {
                // colors
                ...ANSI_COLORS,

                // others
                background: "#fff",
                foreground: "#333",
                cursor: "transparent",
                cursorAccent: "transparent",
                selection: "#ccc",
            },
        });
        this.#fitAddon = new FitAddon();
        this.#terminal.loadAddon(this.#fitAddon);
        this.#terminal.open(this.#container);
        this.#resizeObserver = new ResizeObserver(this.#onResize);
    };

    get terminal() {
        this.#init?.();
        return this.#terminal;
    }

    #onResize = () => {
        this.#fitAddon.fit();
    };

    connectedCallback() {
        this.#init?.();
        this.#resizeObserver.observe(this.#container);
        this.#resizeObserver.observe(this.querySelector(".xterm-screen"));
        this.#onResize();
    }

    disconnectedCallback() {
        this.#init?.();
        this.#resizeObserver.disconnect();
    }
}

customElements.define("xterm-js", XtermJs);
