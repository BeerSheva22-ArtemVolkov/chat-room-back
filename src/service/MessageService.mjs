import MongoConnection from "../domain/MongoConnection.mjs"
// import config from 'config'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import ChatsService from "./ChatsService.mjs"
import mongodb, { ObjectId } from 'mongodb'
// const MONGO_ENV_URI = 'mongodb.env_uri';
// const MONGO_DB_NAME = 'mongodb.db';
// const ENV_JWT_SECRET = 'jwt.env_secret'
const JWT_SECRET = 'art_secret'
const dbName = "pesahChatRoom"
const expiresIn = "30d"

export default class MessageService {

    #collection
    #chatSerice = new ChatsService();

    constructor() {
        // const connection_string = process.env[config.get(MONGO_ENV_URI)];
        // const dbName = config.get(MONGO_DB_NAME);

        const connection_string = `mongodb+srv://root:artem1234@cluster0.oinopsu.mongodb.net/${dbName}?retryWrites=true&w=majority`
        const connection = new MongoConnection(connection_string, dbName);
        this.#collection = connection.getCollection('messages');
    }

    async addMessage(messageObj, sendingDateTime, from) {
        let addedMessage
        try {
            addedMessage = await this.#collection.insertOne({ messageObj, sendingDateTime, from });
        } catch (error) {
            throw error;
        }
        return addedMessage;
    }

    async getMessages(from, to, group, dateTimeFrom, dateTimeTo, filterFrom) {
        let res
        const dtf = new Date(dateTimeFrom);
        const dtt = new Date(dateTimeTo);
        if (to) {
            res = this.#collection.find({
                $and: [
                    {
                        $or: [
                            {
                                ...from && { from },
                                ...to && { "messageObj.to": to }
                            },
                            {
                                ...to && { from: to },
                                ...from && { "messageObj.to": from }
                            }
                        ]
                    }, {
                        ...dateTimeFrom && dateTimeTo && { sendingDateTime: { $gte: dtf, $lte: dtt } }
                    }, {
                        ...filterFrom && { from: filterFrom }
                    }
                ]
            })
        } else {
            res = this.#collection.find({
                $and: [
                    {
                        ...group && { "messageObj.group": group }
                    }, {
                        ...dateTimeFrom && dateTimeTo && { sendingDateTime: { $gte: dtf, $lte: dtt } }
                    }, {
                        ...filterFrom && { from: filterFrom }
                    }
                ]
            })
        }


        // res = this.#collection.find({
        //     ...from && { from },
        //     ...to && { 'messageObj.to': to },
        //     ...group && { 'messageObj.group': group },
        //     ...dateTimeFrom && dateTimeTo && { sendingDateTime: { $gte: dtf, $lte: dtt } }
        // })
        res = await res.toArray();
        // if (dateTimeFrom) {
        //     res = res.filter(r => r.sendingDateTime.getTime() >= dtf.getTime() && r.sendingDateTime.getTime() <= dtt.getTime())
        // }
        return res;
    }

    async deleteMessage(messageId) {
        let deletedMessage
        const objId = new ObjectId(messageId)
        try {
            deletedMessage = await this.#collection.deleteOne({ _id: objId });
        } catch (error) {
            throw error;
        }
        return deletedMessage;
    }

    async messageDetails(messageId) {
        const objId = new ObjectId(messageId)
        const messageDetails = await this.#collection.findOne({ _id: objId })
        if (!messageDetails) {
            throw `message not found`
        }
        return messageDetails;
    }

}