const { OAuth2Client } = require("google-auth-library");
const { GAPI_CLIENT_ID } = require("./config.js");

const client = new OAuth2Client(GAPI_CLIENT_ID);

async function verify(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            requiredAudience: GAPI_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const {
            sub: id,
            hd: domain,
            email,
            name,
            picture: photo,
        } = payload;
        return {
            id, domain, email, name, photo,
        };
    } catch (err) {
        console.warn(err);
        return null;
    }
}

module.exports.verify = verify;
