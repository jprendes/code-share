const { OAuth2Client } = require("google-auth-library");
const { GAPI_CLIENT_ID } = require("./config.js");

const client = new OAuth2Client(GAPI_CLIENT_ID);

async function verify(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GAPI_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const {
            // sub: userid,
            hd: domain,
            email,
            name,
            picture: photo,
        } = payload;
        return {
            domain, email, name, photo,
        };
    } catch (err) {
        console.warn(err);
        return null;
    }
}

module.exports.verify = verify;
