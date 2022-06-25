function get(name) {
    return document.cookie.split("; ").find((s) => s.startsWith(`${name}=`))?.split("=")[1];
}

function set(name, value, maxDays = 30) {
    document.cookie = `${name}=${value}; SameSite=Strict; Path=/; Max-Age=${3600 * 24 * maxDays}`;
}

function del(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

export {
    get, set, del,
};
