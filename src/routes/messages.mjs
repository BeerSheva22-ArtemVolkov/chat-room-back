import express from 'express'
import asyncHandler from 'express-async-handler'
import Joi from 'joi'
import { validate } from '../middleware/validation.mjs';
import authVerification from '../middleware/authVerification.mjs'
import MessageService from '../service/MessageService.mjs';
import ChatsService from '../service/ChatsService.mjs';

export const messages = express.Router();
const messageService = new MessageService();
const chatsService = new ChatsService(); // сделать общим?

// addMessage
messages.post('', asyncHandler(async (req, res) => {
    const sendingDateTime = new Date();
    let messageId = await addMessage(req.body, sendingDateTime)
    if (accountRes == null) {
        res.status(400);
        throw `account ${req.body.username} already exists`
    }
    res.status(201).send(messageId);

}));

// getMessages
messages.get('', authVerification("USER"), asyncHandler(async (req, res) => {
    console.log('getting');
    const result = await messageService.getMessages(req.headers.from, req.headers.to, req.headers.group, req.headers.dtf, req.headers.dtt, req.headers.filter);
    res.status(200).send(result)
}))

// deleteMessage
messages.delete('/:messageId', authVerification("USER"), asyncHandler(async (req, res) => {
    // удалить могу свое или любое, если админ группы
    const messageId = req.params.messageId;
    const requesterName = req.user.username;
    const messageDetails = await messageService.messageDetails(messageId);
    const chatName = messageDetails.messageObj.group;
    const from = messageDetails.from;
    if (!messageDetails) {
        res.status(400);
        throw `Message with id <${messageId}> not found`
    }
    let result
    if (from == requesterName) {
        // удаляем свое сообщение 
        result = await messageService.deleteMessage(messageId);
    } else if (chatName && (await chatsService.chatDetails(chatName)).adminIds.includes(from)) {
        // удаляем сообщение как админ чата
        result = await messageService.deleteMessage(messageId);
    } else {
        res.status(401)
        throw `You have no rihts to delete this message`
    }
    res.status(200).send(result);
}))

export async function addMessage(messageObj, sendingDateTime, from) {
    const addedMessage = await messageService.addMessage(messageObj, sendingDateTime, from);
    return addedMessage.insertedId.toString();
}