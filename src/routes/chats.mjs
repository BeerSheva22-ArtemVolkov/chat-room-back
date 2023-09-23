import express from 'express'
import asyncHandler from 'express-async-handler'
import Joi from 'joi'
import ChatsService from '../service/ChatsService.mjs';
import { validate } from '../middleware/validation.mjs';
import authVerification from '../middleware/authVerification.mjs'

export const chats = express.Router();
const chatsService = new ChatsService();

const schema = Joi.object({
    chatName: Joi.string().min(3).max(10).required()
})

chats.use(validate(schema))

// addChat
// users.post('', authVerification("ADMIN_ACCOUNTS"), valid,  asyncHandler(async (req, res) => {
chats.post('', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatRes = await chatsService.createChat(req.body.chatName, req.user.username, req.body.isOpened);
    if (chatRes == null) {
        res.status(400);
        throw `chat ${req.body.chatName} already exists`
    }
    res.status(201).send(chatRes);
}));

// addUser
chats.post('/addUser/:chatname', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatName = req.params.chatname;
    if (!chatName) {
        res.status(400);
        throw `Chat name is not provided`
    }
    const requesterName = req.user.username;
    const chatFound = await chatsService.chatDetails(chatName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${chatName}> not found`;
    }
    if (!chatFound.adminIds.some(id => id == requesterName)) {
        res.status(403);
        throw 'You have not rigths to adding new admin to chat';
    }
    const chatRes = await chatsService.addUserToChat(chatName, req.body.username, req.body.role);
    if (chatRes == null) {
        res.status(400);
        throw `error adding new admin`
    }
    res.status(200).send(chatRes);
}));

// deleteUser
chats.delete('/removeUser/:chatname', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatName = req.params.chatname;
    if (!chatName) {
        res.status(400);
        throw `Chat name is not provided`
    }
    const requesterName = req.user.username;
    const chatFound = await chatsService.chatDetails(chatName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${chatName}> not found`;
    }
    if (!chatFound.adminIds.some(id => id == requesterName)) {
        res.status(403);
        throw 'You have not rigths to adding new admin to chat';
    }
    const chatRes = await chatsService.deleteUserFromChat(chatName, req.body.username, req.body.role);
    if (chatRes == null) {
        res.status(400);
        throw `error adding new admin`
    }
    res.status(200).send(chatRes);
}));

// joinToChat
chats.post('/join/:chatname', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatName = req.params.chatname;
    if (!chatName) {
        res.status(400);
        throw `Chat name is not provided`
    }
    const requesterName = req.user.username;
    const chatFound = await chatsService.chatDetails(chatName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${chatName}> not found`;
    }
    let result;
    if (chatFound.isOpened) {
        result = await chatsService.addUserToChat(chatName, requesterName, "user");
    } else {
        result = await chatsService.requestAccessToChat(chatName, requesterName);
    }
    if (result == null) {
        res.status(400);
        throw `error joining to chat`
    }
    res.status(200).send(result);
}));

// getRequests
chats.get('/requests/:chatname', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatName = req.params.chatname;
    if (!chatName) {
        res.status(400);
        throw `Chat name is not provided`
    }
    const requesterName = req.user.username;
    const chatFound = await chatsService.chatDetails(chatName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${chatName}> not found`;
    }
    if (!chatFound.adminIds.some(id => id == requesterName)) {
        res.status(403);
        throw 'You have not rigths to adding new admin to chat';
    }
    res.status(200).send(chatFound.waitingIds);
}));

// permitAccessToChat
chats.post('/requests/:chatname', authVerification("USER"), asyncHandler(async (req, res) => {
    const chatName = req.params.chatname;
    if (!chatName) {
        res.status(400);
        throw `Chat name is not provided`
    }
    const requesterName = req.user.username;
    const chatFound = await chatsService.chatDetails(chatName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${chatName}> not found`;
    }
    if (!chatFound.adminIds.some(id => id == requesterName)) {
        res.status(403);
        throw 'You have not rigths to adding new admin to chat';
    }
    const users = req.body.users;
    const decision = req.body.decision;
    const result = await chatsService.setAccessToChat(decision, chatName, users)
    res.status(200).send(result);
}));

export async function getGropupContacts(groupName) {
    const chatFound = await chatsService.chatDetails(groupName);
    if (!chatFound) {
        res.status(403);
        throw `Chat <${groupName}> not found`;
    }
    return chatFound.adminIds.concat(chatFound.membersIds)
}