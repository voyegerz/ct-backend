import express from "express";
import { changeAvatar, editUser, getProfile, login, register } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router()

// Handle all HTTP methods for /login
router.all('/login', (req, res, next) => {
    if (req.method === 'POST') {
        return next(); // If it's a POST request, call the next handler (the specific login handler)
    }
    res.send(`Handled ${req.method} request on /login`);
});

router.get('/:id', getProfile)
router.post('/register', register)
router.post('/login', login)
router.post('/change-avatar', protectRoute, changeAvatar)
router.patch('/edit', protectRoute, editUser)


export default router