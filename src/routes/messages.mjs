import express from 'express'
import asyncHandler from 'express-async-handler'
import Joi from 'joi'
import UsersService from '../service/UsersService.mjs'
import { validate } from '../middleware/validation.mjs';
import authVerification from '../middleware/authVerification.mjs'

export const messages = express.Router();
const usersService = new UsersService();

// addMessage
users.post('', asyncHandler(async (req, res) => {
    const accountRes = await usersService.addAccount(req.body);
    if (accountRes == null) {
        res.status(400);
        throw `account ${req.body.username} already exists`
    }
    res.status(201).send(accountRes);

}));

async function addMessage(from, to, type, message, messageDateTime) {
    
}