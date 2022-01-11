import { Router } from "express";
import User from "../model/user";
import passport from "passport";
import env from "dotenv";
env.config();

import generateToken from "../helper/generateToken";
import { authentication } from "../middleware/adminAuth";

export default ({ config, db }) => {
    const api = Router(); // 'user'

	api.get('/', async (req, res) => {
        return res.send({msg: "User route"});
    });

    api.post('/register', async (req, res) => {

        console.log('Welcome to register')


        const {email, password, name } = req.body;

        console.log('extracted fields')

		await User.findOne({ username: email }, (err, user) => {
            console.log('Inside findone')
			if (err) {
				res.status().send({ status: false, msg: err });
				return;
			}

			if (user) {
                console.log('A user has already registered with this email')
				return res.status(400).json({msg: 'A user has already registered with this email'});
			} else {

				console.log('Welcome to user registration')

                User.register(new User({
                    email,
                    username: email,
                    name
                }),
                password,
                (err, user) => {
                    if (err) {
                        console.log('User registration error: ', err);
                        res.send({ status: false, msg: err.message });
                        return;
                    }

                    if (user) {

                        return res.status(200).json({status: true, userID: user._id, msg: 'Account created.'});

                    }

                })
			}
		}).clone();

	});

	api.post('/login', (req, res) => {
        console.log('Welcome to Login')

		passport.authenticate('local', async function (err, user) {
			// If Passport throws/catches an error
			if (err) {
                console.log('Login Passport error: ', err)                            
				res.status(404).json({ status: false, msg: 'User not found' });
				return;
            }

			if (user) {
                console.log('Found a user match...');
                const token = generateToken(user);
                res.status(200).json({
                    token,
                    user: {
                        _id: user._id,
                        email: user.email,
                    }
                });

			} else {
				// If user is not found
				res.status(401).send({ status: false, msg: 'Email or password is incorrect' });
			}

			
		})(req, res)
    });

    api.get('/:userId', authentication, (req, res) => {

        User.findById(req.params.userId, (err, user) => {
            if (err) {
                console.log("Can't find the user")
                res.status(500).json({ status: false, msg: "Can't find the user" });
				return;
            }

            if (user) {
                console.log("Found the user")
                res.json({
                    user: {
                        _id: user._id,
                        date: user.date,
                        email: user.email,
                        name: user.name
                    }
                });
            }
        })
    });

	return api;
}
