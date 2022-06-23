const cookie = require("cookie");

function get(req, name) {
    const cookies = cookie.parse(req.headers?.cookie || "");
    return cookies[name];
}

function set(res, name, value, maxDays = 30) {
    const cookies = [].concat(res.getHeader("Set-Cookie")).filter(Boolean).filter((c) => c.startsWith(`${name}=`));
    res.setHeader("Set-Cookie", [
        ...cookies,
        `${name}=${value}; SameSite=Strict; Path=/; Max-Age=${3600 * 24 * maxDays}`,
    ]);
}

function del(res, name) {
    const cookies = [].concat(res.getHeader("Set-Cookie")).filter(Boolean).filter((c) => c.startsWith(`${name}=`));
    res.setHeader("Set-Cookie", [
        ...cookies,
        `${name}=FALSE; SameSite=Strict; Path=/; Expires=${new Date(0).toUTCString()}`,
    ]);
}

module.exports = {
    get, set, del, delete: del,
};
