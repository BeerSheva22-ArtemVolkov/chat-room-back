import express from 'express'
import bodyParser from 'body-parser';
import crypto from 'node:crypto'
import expressWs from 'express-ws'
import ChatRoom from './service/ChatRoom.mjs'
import { users } from './routes/users.mjs';
import { chats, getGropupContacts } from './routes/chats.mjs';
import { messages, addMessage } from './routes/messages.mjs';
import errorHandler from './middleware/errorHandler.mjs';
import auth from './middleware/auth.mjs';

const app = express();
const expressWsInstant = expressWs(app);
const chatRoom = new ChatRoom();

app.use(bodyParser.json()); // Разбор JSON-данных
app.use(auth);

app.get('/contacts', (req, res) => {
    res.send(chatRoom.getClients());
})

app.use('/users', users);
app.use('/chats', chats);
app.use('/messages', messages);

app.ws('/contacts/websocket', (ws, req, next) => {
    // req.query - это то что идет после ? в пути запроса (аналог pathVariables из Spring)
    // req.params - это должна быть часть запроса и вместо "/contacts/websocket" должно быть "/contacts/websocket/:id" (аналог RequestParams из Spring)
    // ws.protocol - это  (аналог body из Spring)
    const clientName = req.headers.username
    let connctionId
    if (!clientName) {
        ws.send("must be nickname");
        ws.close();
    } else {
        processConnection(clientName, ws);
    }
})

app.ws('/contacts/websocket/close', (ws, req) => {
    ws.close();
})

function processConnection(clientName, ws) {
    const connectionId = crypto.randomUUID();
    chatRoom.addConnection(clientName, connectionId, ws);
    ws.on('close', () => chatRoom.removeConnection(connectionId));
    // ws.on('message', message => chatRoom.getAllWebSockets().forEach(ws => ws.send(message)));
    ws.on('message', processMessage.bind(undefined, clientName, ws));
}

async function processMessage(clientName, ws, message) {
    try {
        const messageObj = JSON.parse(message.toString());
        const to = messageObj.group || messageObj.to;
        const text = messageObj.text;
        if (!text) {
            ws.send("your message doesn't contain text")
        } else {
            const sendingTime = new Date();
            const messageId = await addMessage(messageObj, sendingTime, clientName);
            const objSend = JSON.stringify({ from: clientName, text, sendingTime, messageId });
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

function sendMessageToClient(message, client, socketFrom) {
    const clientSockets = chatRoom.getClientWebSockets(client);
    if (clientSockets.length == 0) {
        socketFrom.send(client + " contact doesn't exists")
    } else {
        clientSockets.forEach(s => s.send(message));
    }
}

async function sendMessageToChatGroup(message, groupName, socketFrom) {
    const members = await getGropupContacts(groupName);
    const clientSockets = chatRoom.getClientsWebSockets(members);
    clientSockets.forEach(ws => ws.send(message));
}

const server = app.listen(8080)

server.on('listening', () => {
    console.log('start listening');
})

app.use(errorHandler)