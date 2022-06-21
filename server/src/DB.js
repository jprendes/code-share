const { Level } = require("level");

const { DB_ROOT } = require("./config.js");

const db = new Level(DB_ROOT, { valueEncoding: "json" });

module.exports.save = function save(key, value) {
    return db.put(key, value);
};

module.exports.load = async function load(key) {
    const [value] = await db.getMany([key]);
    return value;
};
