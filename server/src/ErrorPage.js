/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const { get, STATUS_CODES } = require("http");
const { readFile } = require("fs/promises");

const loadedIcons = new Map();
function loadIcon(icon, variant = "round") {
    const full = `${icon}/${variant}`;
    if (loadedIcons.has(full)) return loadedIcons.get(full);
    const file = readFile(require.resolve(`@material-icons/svg/svg/${icon}/${variant}.svg`, "utf8"));
    loadedIcons.has(full, file);
    return file;
}

const MESSAGE = {
    404: "Sorry but the page you are looking for does not exist, or is temporarily unavailable-",
    500: "It looks like our server had a hiccup. Please try again.",
};

const HREF = {
    // eslint-disable-next-line no-script-url
    500: "javascript:window.location.href=window.location.href",
};

const ACTION = {
    500: "Try again",
};

class ErrorPage {
    template = null;

    static fromStaticServer(server) {
        return new ErrorPage(server.get("/.error-template.html")?.text);
    }

    static fromHttpServer(host, port) {
        const page = new ErrorPage();
        get(`http://${host}:${port}/.error-template.html`, (res) => {
            const chunks = [];
            res.on("data", (fragments) => chunks.push(fragments));
            res.on("end", () => { page.template = Buffer.concat(chunks).toString(); });
        });
        return page;
    }

    constructor(template) {
        this.template = template;
    }

    async render(options) {
        if ((typeof options === "number") || (typeof options === "string")) {
            options = { code: options };
        }
        const {
            icon = "sentiment_dissatisfied",
            variant = "round",
            code,
            title = code,
            status = STATUS_CODES[code],
            message = MESSAGE[code] || "",
            href = HREF[code] || "/",
            action = ACTION[code] || "Back to homepage",
        } = options;

        if (!this.template) return options.status;

        return this.template
            .replace(/\$\{icon\}/g, await loadIcon(icon, variant))
            .replace(/\$\{code\}/g, title)
            .replace(/\$\{status\}/g, status)
            .replace(/\$\{message\}/g, message)
            .replace(/\$\{href\}/g, href)
            .replace(/\$\{action\}/g, action);
    }

    async serve(req, res, options = {}) {
        if ((typeof options === "number") || (typeof options === "string")) {
            options = { code: options };
        }
        const { code } = options;
        const html = await this.render(options);
        res.writeHead(parseInt(code, 10), STATUS_CODES[code], {
            "Content-Type": this.template ? "text/html" : "text/plain",
            "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        });
        res.end(html);
    }
}

module.exports = ErrorPage;
