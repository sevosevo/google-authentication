const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const request = require('request');
/**
 *	1. Verify user / token
 *	2. Try to find user from decoded token
 *	3. Put user document on request
 *	4. Continue with the request
 */ 
function verifyJwtToken(req, res, next) {
	const token = req.headers['authorization'];
	const decoded = jwt.verify(token, process.env.jwtSecret);
	User.findOne({ _id: decoded.sub })
		.then(user => {
			if(!user) return next('Token is vaid but user doesn\'t exist anymore');
				req.user = user;
				req.token = token;
				return next();
			})
		.catch(next);
};
/**
 *	1. Check if token expired
 *  2. If it did, request new access token with refresh token
 *  3. Save new token to db
 *  4. Continue with the request
 */
function ifAccessTokenExpiredRenew(req, res, next) {
	const added = req.user.google.added;
	if( added.setHours(added.getHours() + 1) < new Date(Date.now()) ) {
		if(!req.user.google.refresh_token) {
			return next('Error happened trying to do google service, logout and login then try again...');
		}
		request(`https://www.googleapis.com/oauth2/v4/token`, {
			method: 'POST',
			formData: {
				client_id: "844028615481-j9br04ti23f3a81tkc35s2euqu72r2ov.apps.googleusercontent.com",
				client_secret: "uS13VMehK-EngvdMJbG_jnxE",
				refresh_token: req.user.google.refresh_token,
				grant_type: 'refresh_token'
			}
		}, async (error, response, body) => {
			const new_access_token = JSON.parse(body);
			req.user.google.token = new_access_token;
			req.user.google.added = Date.now();
			await req.user.save();
			next();
		});
	}else{
		next();
	}
};
/**
 * Used to check if user is authenticated with google method
 */
function verifyIfGoogle(req, res, next) {
	if(req.user.google) {
		next();
	}else{
		next(new Error('This feature is only for users logged in with Google.'));
	}
};

module.exports = {
	verifyJwtToken,
	ifAccessTokenExpiredRenew,
	verifyIfGoogle
};