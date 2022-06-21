// const { spawn } = require("child_process");
const { mkdir, rm, writeFile } = require("fs/promises");
const { join } = require("path");

const { spawn } = require("node-pty");
const { Observable } = require("lib0/observable");
const { uuidv4 } = require("lib0/random");

function ansiFormat(format, text) {
    return `\x1B[${format}m${text}\x1B[0m`;
}

function boldRed(text) {
    return ansiFormat("31;1", text);
}

function boldGreen(text) {
    return ansiFormat("32;1", text);
}

async function ensuredir(dir) {
    try {
        await mkdir(dir, true);
    } catch (err) {
        if (err.code !== "EEXIST") throw err;
    }
}

function prepareCommands(cmds) {
    cmds = cmds
        .flatMap((cmd) => [`echo "${boldGreen(`> ${cmd}`)}"`, `${cmd} 2>&1`])
        .join(" && ");
    cmds += ` && echo "\n${boldGreen("Exit code: 0")}"`;
    cmds += ` || echo "\n${boldRed("Exit code: $?")}"`;
    return cmds;
}

function waitOnChild(child) {
    return new Promise((resolve) => {
        child.onExit(resolve);
    });
}

const BUBBLEWRAP_BIN = "bwrap";
const BUBBLEWRAP_ARGS = [
    "--unshare-all",
    "--new-session",
    "--die-with-parent",
    "--cap-drop", "ALL",
    "--ro-bind", "/usr", "/usr",
    "--symlink", "/usr/lib64", "/lib64",
    "--tmpfs", "/tmp",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind-try", join(process.env.HOME, ".rustup"), "/home/user/.rustup",
    "--clearenv",
    "--setenv", "HOME", "/home/user",
    "--setenv", "PATH", "/usr/local/bin:/usr/bin:/usr/local/sbin",
    "--setenv", "TERM", "xterm-256color",
];

function bubblewrapRun(cwd, cmds) {
    return spawn(BUBBLEWRAP_BIN, [
        ...BUBBLEWRAP_ARGS,
        "--bind", cwd, "/src",
        "--chdir", "/src",
        "bash", "-c",
        prepareCommands(cmds),
    ], {
        name: "xterm-256color",
    });
}

class Compiler extends Observable {
    #hash = uuidv4();

    #language = null;
    get language() { return this.#language; }
    set language(language) {
        if (language === this.#language) return;
        if (!this.languages.includes(language)) {
            throw new Error(`Invalid compialtion language ${language}. Available options: ${JSON.stringify(this.languages)}`);
        }
        this.#language = language;
    }

    static get COMMANDS() {
        return {
            c: {
                extension: "c",
                commands: ["clang -o main main.c", "./main"],
            },
            cpp: {
                extension: "cpp",
                commands: ["clang++ -std=c++17 -o main main.cpp", "./main"],
            },
            rust: {
                extension: "rs",
                commands: ["rustc -o main main.rs", "./main"],
            },
        };
    }

    #commands = { ...Compiler.COMMANDS };
    get languages() { return Object.keys(this.#commands); }

    constructor(commands = Compiler.COMMANDS) {
        super();
        this.#commands = commands;
        [this.#language] = Object.keys(commands);
    }

    #compilation = null;
    get compilation() { return this.#compilation; }

    async compile(code) {
        if (!this.compilation) {
            this.#compilation = this.#compile(code);
            await this.compilation;
            this.#compilation = null;
        }
        return this.compilation;
    }

    async kill(reason = "Execution terminated by user") {
        if (!this.compilation) return;
        await this.#kill?.(reason);
    }

    output = "";

    #compile = async (code) => {
        this.output = "";
        try {
            const { extension, commands } = this.#commands[this.language];
            await this.#runCompilation(code, extension, commands);
        } catch (err) {
            console.log(err);
        }
    };

    #appendOutput = (text) => {
        text = text.toString();
        this.output += text.toString();
        if (this.output.length > 100 * 1024) {
            // Don not cache more than 100kB of output
            this.output = this.output.slice(-10240);
        }
        this.emit("progress", [{ data: text }]);
    };

    #appendOutputLn = (...texts) => {
        let text = texts.join("\n");
        if (this.output && !this.output.endsWith("\n")) text = `\n${text}`;
        this.#appendOutput(`${text}\n`);
    };

    #runCompilation = async (code, ext, cmds) => {
        const cwd = `/tmp/${this.#hash}`;
        await ensuredir(cwd);

        const filename = `${cwd}/main.${ext}`;
        await writeFile(filename, code);

        const child = bubblewrapRun(cwd, cmds);
        this.#kill = (reason) => {
            child.kill("SIGKILL");
            this.#appendOutputLn("", boldRed(reason));
        };

        child.onData(this.#appendOutput);

        const timeoutId = setTimeout(() => this.#kill?.("Execution timed out"), 20e3);

        await waitOnChild(child);

        this.#kill = null;
        clearTimeout(timeoutId);

        // ensure we end with a newline
        if (this.output && !this.output.endsWith("\n")) this.#appendOutput("\n");

        await rm(cwd, { force: true, recursive: true });
    };

    #kill = null;
}

module.exports = Compiler;
