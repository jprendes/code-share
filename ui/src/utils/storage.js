function get(name) {
    try {
        return JSON.parse(window.localStorage.getItem(name));
    } catch (e) {
        return null;
    }
}

function set(name, value) {
    window.localStorage.setItem(name, JSON.stringify(value));
}

function del(name) {
    window.localStorage.removeItem(name);
}

function onchange(f) {
    const fcn = () => f();
    window.addEventListener("storage", fcn);
    return {
        remove: () => window.removeEventListener("storage", fcn),
    };
}

function watch(name, callback) {
    let old = get(name);
    return onchange(() => {
        const val = get(name);
        callback(old, val);
        old = val;
    });
}

export {
    get, set, del, onchange,
};
