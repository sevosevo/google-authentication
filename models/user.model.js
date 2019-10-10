const mongoose = require('mongoose');
const User = require('./user.class');

const GoogleSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    refresh_token: String,
    access_token: {
        type: String,
        required: true
    },
    added: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

const DefaultSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
}, {
    _id: false
});

const UserSchema = mongoose.Schema({
    method: {
        type: String,
        enum: ['DEFAULT', 'GOOGLE'],
        required: true
    },
    google: GoogleSchema,
    default: DefaultSchema
});

UserSchema.loadClass(User);

module.exports = mongoose.model('users', UserSchema);