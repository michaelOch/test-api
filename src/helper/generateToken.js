import env from "dotenv";
env.config();
import jwt from "jsonwebtoken";


const TOKEN_TIME = '0.01d';

const generateToken = (user) => {
  
    const token = jwt.sign({
      id: user.id,
      email: user.email
    },
    process.env.SECRET, {
        expiresIn: TOKEN_TIME
    });

    return token;
};

export default generateToken;