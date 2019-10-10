class User {
    static findByEmail(email) {
        return this.findOne({email});
    }
    static googleUserExists(googleId) {
        return this.findOne({'google.id': googleId});
    }
}

module.exports = User;