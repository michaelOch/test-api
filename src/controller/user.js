import { Router } from "express";
import User from "../model/user";
import passport from "passport";
import env from "dotenv";
env.config();
import jwt from "jsonwebtoken";

import generateToken from "../helper/generateToken";
import { authentication } from "../middleware/adminAuth";

export default ({ config, db }) => {
    const api = Router(); // 'user'

	api.get('/', authentication, async (req, res) => {
        
        User
            .find({}, null, { sort: { date: 'desc' } })
            .exec((err, users) => {
                if (err) {
                    return res.status(505).json({ status: false, message: "A server error occured" });
                }

                if (users) {
                    res.status(200).send({ status: true, users: users });
                }
            });
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

	api.post('/login', async (req, res) => {
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

                //  Create refresh token
                const refreshToken = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.SECRET, 
                    { expiresIn: '5m' }
                )

                try {
                    const response = await User.findOne({ _id: user._id });

                    await response.updateOne({ refreshToken: refreshToken })

                    res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000 })
                        res.status(200).json({
                            token,
                            user: {
                                _id: user._id,
                                email: user.email,
                                name: user.name
                            }
                        });
                    return;
                } catch (error) {
                    console.log(error);
                    return res.status(500).send({
                        status: false,
                        message: err
                    });
                }

			} else {
				// If user is not found
				res.status(401).send({ status: false, msg: 'Email or password is incorrect' });
			}

			
		})(req, res)
    });

    //  Handle refresh token
    api.get('/refresh', (req, res) => {

        console.log('Inside refresh token route');

        const cookies = req.cookies;
        if(!cookies?.jwt) return res.sendStatus(401);
        console.log(cookies.jwt);

        const refreshToken = cookies.jwt;

        User.findOne({ refreshToken: refreshToken }, (err, user) => {
            console.log("Trying to find the user")
            if (err) {
                console.log("Can't find the user")
                return res.status(403).json({ status: false, msg: "Can't find the user" });
            }

            console.log("Passed error stage! Good!");

            if (user) {
                console.log("Found user")
                jwt.verify(
                    refreshToken,
                    process.env.SECRET,
                    (err, authorizedUser) => {
                        // console.log(`User Email - ${user?.email}`);
                        // console.log(`Authorized Email - ${authorizedUser?.email}`);
                        if (err || user.email !== authorizedUser.email) return res.sendStatus(403);
                        const token = generateToken(user);
                        // console.log('New token: ' + token);
                        res.status(200).json({
                            token,
                            user: {
                                _id: user._id,
                                email: user.email,
                                name: user.name
                            }
                        });
                    }
                )
            }
        })
    });

    // Logout
    api.get('/logout', async (req, res) => {
        
        const cookies = req.cookies;
        if (!cookies?.jwt) return res.sendStatus(204); // No content

        const refreshToken = cookies.jwt;

        User.findOne({ refreshToken: refreshToken }, (err, user) => {
            if (err) {
                res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
                return res.sendStatus(204);
            }

            // Delete refreshToken from DB
            User.update({ refreshToken: '' }, {
                where: {
                    _id: user.id
                }
            })
            .then(user => {
                
                res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
                res.sendStatus(204);
            })
            .catch(err => {
                console.log(err);
                return res.status(500).send({
                    status: false,
                    message: err
                });
            });
        })
    });

    api.get('/:userId', authentication, async (req, res) => {

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
