require('dotenv').config();
//Using express for building API endpoints
const express = require('express');
//Init app with express
const app = express();
//Request is used for making HTTP requests from our backend
const request = require('request');
//jsonwebtokens
const jwt = require('jsonwebtoken');
//Secret for jwt
const jwtSecret = process.env.jwtSecret;
//Includes client_id, client_secret, redirect_uri and scopes 
const GOOGLE_API = require('./google.config');
//Database connection
const connect = require('./connection.mongoose');
//Helper method for our google authentication
const { 
	verifyJwtToken, 
	verifyIfGoogle, 
	ifAccessTokenExpiredRenew 
} = require('./auth.middlewares');

const User = require('./models/user.model');
/**
	1. Create redirection URL
	2. Redirect user to redirection URL
	3. Google will handle user authentication
	4. After Google authenticates user, it will redirect him to /google/redirect with token in params that can be exchanged for access token 
*/
app.get('/google', (req, res, next) => {
	//Params for redirect url
	const params = new URLSearchParams({
		access_type: 'offline', //Get refresh token
		scope: GOOGLE_API.scopes.join(' '), 
		response_type: 'code',
		client_id: GOOGLE_API.client_id,
		redirect_uri: GOOGLE_API.redirect_uri
	});
	//Url
	const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'+params;
    //Redirect to url
    res.redirect(authUrl);
});
/**
	1. Route used for getting the code from redirection and using it to get access_token for google API
	2. Register user to our database
	3. Store access_token and refresh_token to our database
	4. Sign JWT used 
*/
app.get('/google/redirect', (req, res, next) => {
	const { code } = req.query;
	request('https://accounts.google.com/o/oauth2/token', {
		method: 'POST',
		formData: {
			client_id: GOOGLE_API.client_id,
			client_secret: GOOGLE_API.client_secret,
			grant_type: 'authorization_code',
			redirect_uri: GOOGLE_API.redirect_uri,
			code
		}
	}, (error, response, body) => {
		if(error) return next(error);
		const accessToken = JSON.parse(body);
		request('https://www.googleapis.com/plus/v1/people/me?access_token='+accessToken.access_token, async (error, response, body) => {
			const profile = JSON.parse(body);
			//Store user in db
			const userExist = await User.googleUserExists(profile.id);
			if(! userExist ) {
				const user = new User({
					method: 'GOOGLE',
					google: {
						id: profile.id,
						email: profile.emails[0].value,
						access_token: accessToken.access_token,
						refresh_token: accessToken.refresh_token
					}
				});
				await user.save();
				const token = jwt.sign({
					method: 'GOOGLE',
					iss: 'Web Application',
					sub: user._id.toString(),
					iat: new Date().getTime()
				}, jwtSecret, { expiresIn: '1h' });
				res.json(token);
			}else{
				const token = jwt.sign({
					method: 'GOOGLE',
					iss: 'Web Application',
					sub: userExist._id.toString(),
					iat: new Date().getTime()
				}, jwtSecret, { expiresIn: '1h' });

				res.json(token);
			}
		});
	});
});

app.get('/access', verifyJwtToken, verifyIfGoogle, ifAccessTokenExpiredRenew, async (req, res, next) => {
	res.send('You can do google services');
});

app.listen(3001, () => {
	console.log('Connecting to db');
	connect((db) => {
		console.log('Connected to database with mongoose');
	});
});

