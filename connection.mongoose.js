require('dotenv').config();

const mongoose = require('mongoose');

const connect = (callback) => {
    mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((db) => {
        callback(db);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
}

module.exports = connect;