const { join } = require("path");

const { env } = process;

const DB_ROOT = env.DB_ROOT || "state";
const Y_DB_ROOT = env.Y_DB_ROOT || join(DB_ROOT, "yjs");
const UI_ROOT = env.UI_ROOT || "";
const UI_HOST = env.UI_HOST || "localhost";
const UI_PORT = parseInt(env.UI_PORT, 10) || 8088;
const UI_TITLE = env.UI_TITLE || "Code Share";
const PARALLEL_RUNS = parseInt(env.PARALLEL_RUNS, 10) || 32;
const HTTPS = !!env.HTTPS && env.HTTPS !== "0";
const HOST = env.HOST || "0.0.0.0";
const PORT = parseInt(env.PORT, 10) || 8080;
const GAPI_CLIENT_ID = env.GAPI_CLIENT_ID || "";

module.exports = {
    DB_ROOT,
    Y_DB_ROOT,
    UI_ROOT,
    UI_HOST,
    UI_PORT,
    UI_TITLE,
    PARALLEL_RUNS,
    HTTPS,
    HOST,
    PORT,
    GAPI_CLIENT_ID,
};
