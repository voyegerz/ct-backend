import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '15d'
    })

    res.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000, //15 days in milliseconds
        httpOnly: true, //prevents XSS attacks cross-site scripting attacks
        sameSite: "none", //prevents CSRF attacks cross-site request forgery attacks
        secure: true,
    })
}