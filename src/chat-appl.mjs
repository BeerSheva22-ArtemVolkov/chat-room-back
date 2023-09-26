import express from 'express'
import bodyParser from 'body-parser';
import crypto from 'node:crypto'
import expressWs from 'express-ws'
import ChatRoom from './service/ChatRoom.mjs'
import cors from 'cors'
import { users, getAllUsers } from './routes/users.mjs';
import { chats, getGroupContacts, getUserGroups } from './routes/chats.mjs';
import { messages, addMessage } from './routes/messages.mjs';
import errorHandler from './middleware/errorHandler.mjs';
import auth from './middleware/auth.mjs';
import asyncHandler from 'express-async-handler'

const app = express();
const expressWsInstant = expressWs(app);
const chatRoom = new ChatRoom();

app.use(cors());
app.use(bodyParser.json()); // Разбор JSON-данных
app.use(auth);

app.get('/contacts', (req, res) => {
    res.send(chatRoom.getClients());
})

app.use('/users', users);
app.use('/chats', chats);
app.use('/messages', messages);

app.get('/groups', asyncHandler(async (req, res) => {
    const groups = await getUserGroups(req.user.username)
    const personal = await getAllUsers();
    res.send({ groups, personal });
}))

app.ws('/contacts/websocket/:userName', (ws, req, next) => {
    // req.query - это то что идет после ? в пути запроса (аналог pathVariables из Spring)
    // req.params - это должна быть часть запроса и вместо "/contacts/websocket" должно быть "/contacts/websocket/:id" (аналог RequestParams из Spring)
    // ws.protocol - это  (аналог body из Spring)
    console.log('contacts/websocket');
    // const clientName = req.headers.username
    const userName = req.params.userName
    console.log(userName);
    if (!userName) {
        ws.send("must be nickname");
        ws.close();
    } else {
        processConnection(userName, ws);
    }
})

app.ws('/contacts/websocket/close', (ws, req) => {
    ws.close();
})

function processConnection(userName, ws) {
    const connectionId = crypto.randomUUID();
    chatRoom.addConnection(userName, connectionId, ws);
    ws.on('close', () => chatRoom.removeConnection(connectionId));
    // ws.on('message', message => chatRoom.getAllWebSockets().forEach(ws => ws.send(message)));
    ws.on('message', processMessage.bind(undefined, userName, ws));
}

async function processMessage(userName, ws, message) {
    try {
        const messageObj = JSON.parse(message.toString());
        const to = messageObj.group || messageObj.to;
        const text = messageObj.text;
        if (!text) {
            ws.send("your message doesn't contain text")
        } else {
            const sendingTime = new Date();
            const messageId = await addMessage(messageObj, sendingTime, userName);
            const objSend = JSON.stringify({ from: userName, text, sendingTime, messageId });
            if (messageObj.group) {
                sendMessageToChatGroup(objSend, to, ws)
            } else {
                sendMessageToClient(objSend, to, ws);
            }
        }
    } catch (error) {
        ws.send('wrong message structure');
    }
}

function sendAll(message) {
    chatRoom.getClientsWebSockets().forEach(ws => ws.send(message));
}

function sendMessageToClient(message, client, socketFrom, from) {
    const clientSockets = chatRoom.getClientWebSockets(client);
    if (clientSockets.length == 0) {
        socketFrom.send(client + " contact doesn't exists")
    } else {
        // const currentUserSockets = chatRoom.getClientWebSockets(client);
        clientSockets.forEach(s => s.send(message));
        socketFrom.send("Message send")
    }
}

async function sendMessageToChatGroup(message, groupName, socketFrom) {
    const members = await getGroupContacts(groupName);
    const clientSockets = chatRoom.getClientsWebSockets(members);
    clientSockets.forEach(ws => ws.send(message));
}

const server = app.listen(8080)

server.on('listening', () => {
    console.log('start listening');
})

app.use(errorHandler)