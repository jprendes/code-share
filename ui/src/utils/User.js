class User {
    #name = "";
    #email = "";
    #photo = "";

    constructor({ email, name, photo }) {
        this.#name = name;
        this.#email = email;
        this.#photo = photo;
    }

    get name() { return this.#name; }
    get email() { return this.#email; }
    get photo() { return this.#photo; }

    eq(other) {
        return this.name === other.name
            && this.email === other.email
            && this.photo === other.photo;
    }
}

export default User;
