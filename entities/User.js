class User {
    constructor({ id, name, email, password, credits = 20, files_uploaded = null, role = "user" }) {
        if (!name || !email || !password) {
            throw new Error("Missing required fields");
        }
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.credits = credits;
        this.files_uploaded = files_uploaded;
        this.role = role;
    }
}
module.exports = User;