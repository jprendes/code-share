import { html, render } from "lit";

import "@fontsource/roboto";

import "./code-share.js";

render(html`
    <style>
        html,
        body {
            display: grid;
            grid-template-columns: 100% 0;
            grid-template-rows: 100% 0;
            width: 100%;
            height: 100%;
            min-width: 640px;
            min-height: 480px;
            padding: 0;
            margin: 0;
            overflow: auto;
            background: #f3f3f3;
        }
        active-overlay,
        sp-tooltip {
            max-width: none !important;
        }
    </style>
    <code-share></code-share>
`, document.body);
