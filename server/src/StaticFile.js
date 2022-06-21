const { promisify } = require("node:util");
const { gzip: gzipCb, brotliCompress: brotliCb } = require("zlib");
const mime = require("mime-types");

const gzip = promisify(gzipCb);
const brotli = promisify(brotliCb);

const BROTLI_ENC = ["br"];
const GZIP_ENC = ["compress", "gzip", "deflate"];

function acceptsEncoding(client, server) {
    if (client.includes("*")) return true;
    return client.some((enc) => server.includes(enc));
}

class StaticFile {
    constructor(path, content, { cache = 0 } = {}) {
        this.#path = path;
        this.#hidden = path.includes("/.");
        this.#content = content;
        this.cache = cache;
        if (content instanceof Promise) {
            content.then((data) => { this.#content = data; });
        }
        this.#mimetype = mime.lookup(path) || "application/octet-stream";
    }

    #path = "";
    get path() { return this.#path; }
    #mimetype = "";
    get mimetype() { return this.#mimetype; }

    #content = null;
    get content() { return this.#content; }
    get text() { return this.#content.toString(); }

    #hidden = false;
    get hidden() { return this.#hidden; }

    cache = 0;

    #gz = null;
    gzip(...args) {
        if (args.length > 0) {
            const [gz] = args;
            if (gz instanceof Buffer) {
                this.#gz = gz;
            } else if (gz) {
                this.#gz = (async () => {
                    this.#gz = await gzip(await this.content, gz);
                    return this.#gz;
                });
            } else {
                this.#gz = null;
            }
        }
        return this.#gz;
    }

    #br = null;
    brotli(...args) {
        if (args.length > 0) {
            const [br] = args;
            if (br instanceof Buffer) {
                this.#br = br;
            } else if (br) {
                this.#br = (async () => {
                    this.#br = await brotli(await this.content, br);
                    return this.#br;
                });
            } else {
                this.#br = null;
            }
        }

        return this.#br;
    }

    serve(req, res, headers = {}) {
        const send = (c) => {
            res.writeHead(200, headers);
            res.end(c);
        };

        headers["Content-Type"] = this.mimetype;

        if (this.cache === 0) {
            headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate";
        } else if (this.cache === Infinity) {
            headers["Cache-Control"] = "max-age=31536000, immutable";
        } else {
            headers["Cache-Control"] = `max-age=${this.cache}`;
        }

        const encs = req.headers?.["accept-encoding"]?.split(",").map((enc) => enc.trim()) || [];

        let { content } = this;

        if (this.#br instanceof Buffer && acceptsEncoding(encs, BROTLI_ENC)) {
            content = this.#br;
            headers["Content-Encoding"] = "br";
        } else if (this.#gz instanceof Buffer && acceptsEncoding(encs, GZIP_ENC)) {
            content = this.#gz;
            headers["Content-Encoding"] = "gzip";
        }

        if (content instanceof Promise) return content.then(send);
        return send(content);
    }
}

module.exports = StaticFile;
