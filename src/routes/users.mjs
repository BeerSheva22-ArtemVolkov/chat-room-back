import express from 'express'
import asyncHandler from 'express-async-handler'
import Joi from 'joi'
import UsersService from '../service/UsersService.mjs'
import { validate } from '../middleware/validation.mjs';
import authVerification from '../middleware/authVerification.mjs'
import multer from 'multer';

export const users = express.Router();
const usersService = new UsersService();
const storage = multer.memoryStorage(); // Сохранение файла в памяти
const upload = multer({ storage });

const schema = Joi.object({
    username: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    roles: Joi.array().items(Joi.string().valid('ADMIN', 'USER')).required()
})

users.use(validate(schema))

// addAccount
// users.post('', authVerification("ADMIN_ACCOUNTS"), valid,  asyncHandler(async (req, res) => {
users.post('', asyncHandler(async (req, res) => {
    const accountRes = await usersService.addAccount(req.body);
    if (accountRes == null) {
        res.status(400);
        throw `account ${req.body.username} already exists`
    }
    res.status(201).send(accountRes);
}));

users.post("/login", asyncHandler(
    async (req, res) => {
        const loginData = req.body;
        const accessToken = await usersService.login(loginData);
        if (!accessToken) {
            res.status(400);
            throw 'Wrong credentials'
        }
        res.send({ accessToken });
    }
))

users.get('', authVerification("USER"), asyncHandler(async (req, res) => {
    const users = await getAllUsers();
    res.status(200).send(users);
}))

users.put('', authVerification("USER"), asyncHandler(async (req, res) => {
    const username = req.user.username
    const image = req.body.image;
    const result = await usersService.updateAccount(image, username)
    res.status(200).send(result);
}))

export async function getAllUsers() {
    return await usersService.getAllUsers();
}

