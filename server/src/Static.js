const { ServerResponse, STATUS_CODES } = require("http");
const { readdirSync, readFileSync, lstatSync } = require("fs");
const { join } = require("path");
const StaticFile = require("./StaticFile.js");

function readdir(root, dir = "", map = {}) {
    const files = readdirSync(join(root, dir));
    for (const filename of files) {
        const stat = lstatSync(join(root, dir, filename));
        if (stat.isDirectory()) {
            readdir(root, join(dir, filename), map);
        } else {
            const path = join("/", dir, filename);
            map[path] = readFileSync(join(root, dir, filename));
        }
    }
    return map;
}

function compressionType(path) {
    if (path.endsWith(".gz")) return ["gzip", path.slice(0, -3)];
    if (path.endsWith(".br")) return ["brotli", path.slice(0, -3)];
    return ["", path];
}

function handleCompression(files, path) {
    const [type, base] = compressionType(path);
    if (!type) return;
    const fileinfo = files[base];
    if (!fileinfo) return;
    const { content } = files[path];
    delete files[path];
    fileinfo[type](content);
}

function handleIndex(files, path) {
    if (!path.endsWith("/index.html")) return;
    const fileinfo = files[path];
    files[path.slice(0, -10)] = fileinfo; // /a/folder/
    files[path.slice(0, -11)] = fileinfo; // /a/folder
}

class Static {
    #files = {};

    static fromRoot(root) {
        return new Static(readdir(root));
    }

    constructor(files) {
        // set default onError handler
        this.onError(null);

        for (const [path, content] of Object.entries(files)) {
            const fileinfo = new StaticFile(path, content, { cache: Infinity });
            this.#files[path] = fileinfo;
            if (path.endsWith("/index.html")) {
                fileinfo.cache = 0;
            }
        }

        for (const path of Object.keys(this.#files)) {
            handleCompression(this.#files, path);
            handleIndex(this.#files, path);
        }
    }

    has(path) {
        return !!this.#files[path];
    }

    get(path) {
        return this.#files[path];
    }

    serve(...args) {
        if (args[1] instanceof ServerResponse) {
            return this.#http(...args);
        }
        return this.#ws(...args);
    }

    #onError = null;
    onError(fcn) {
        if (!fcn) {
            fcn = (req, res, { code, status }) => {
                res.writeHead(code, status, { "Content-Type": "text/plain" });
                res.end(status);
            };
        }
        this.#onError = fcn;
        return this;
    }

    #http = (req, res, options = {}) => {
        const path = decodeURIComponent(options.path || req.url);
        const file = this.get(path);

        if (!file || file.hidden) {
            return this.#onError(req, res, { code: 404, status: STATUS_CODES[404] });
        }

        return file.serve(req, res);
    };

    // eslint-disable-next-line class-methods-use-this
    #ws = (req, socket) => {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
    };
}

module.exports = Static;
