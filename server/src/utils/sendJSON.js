function sendJSON(res, val) {
    res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
    });
    res.end(JSON.stringify(val));
}

module.exports = sendJSON;
