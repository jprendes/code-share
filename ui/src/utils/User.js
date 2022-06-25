class User {
    #uuid = "";
    #name = "";
    #email = "";
    #photo = "";

    constructor({
        uuid, email, name, photo,
    }) {
        this.#uuid = uuid;
        this.#name = name;
        this.#email = email;
        this.#photo = photo;
    }

    get uuid() { return this.#uuid; }
    get name() { return this.#name; }
    get email() { return this.#email; }
    get photo() { return this.#photo; }

    eq(other) {
        return User.eq(this, other);
    }

    static eq(a, b) {
        if (!!a !== !!b) return false;
        if (!a) return true;
        return a.uuid === b.uuid
            && a.name === b.name
            && a.email === b.email
            && a.photo === b.photo;
    }
}

export default User;
