const MongoClient = require('mongodb').MongoClient;
//URI for connecting to mongodb
const URL = process.env.MONGODB_URL;

const handler = {
	get: function(target, prop, receiver) {
		if(typeof target[prop] === 'function' && !target[prop].name.startsWith('bound ')) {
			target[prop] = target[prop].bind(target);
		}
		return target[prop];
	}
}

const conn = new Proxy({
	_db: null,
	connect(callback) {
		MongoClient.connect(URL, (err, client) => {
			if(err) console.error(err);
			this._db = client.db();
			callback(this._db);
		});
	},
	getDb() {
		return this._db;
	}
}, handler);

module.exports = conn;