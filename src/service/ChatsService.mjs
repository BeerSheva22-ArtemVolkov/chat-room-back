import MongoConnection from "../domain/MongoConnection.mjs"
// import config from 'config'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// const MONGO_ENV_URI = 'mongodb.env_uri';
// const MONGO_DB_NAME = 'mongodb.db';
// const ENV_JWT_SECRET = 'jwt.env_secret'
const JWT_SECRET = 'art_secret'
const dbName = "pesahChatRoom"
const expiresIn = "30d"

export default class ChatsService {

    #collection

    constructor() {
        // const connection_string = process.env[config.get(MONGO_ENV_URI)];
        // const dbName = config.get(MONGO_DB_NAME);
        const connection_string = `mongodb+srv://root:artem1234@cluster0.oinopsu.mongodb.net/${dbName}?retryWrites=true&w=majority`
        const connection = new MongoConnection(connection_string, dbName);
        this.#collection = connection.getCollection('chats');
    }

    async createChat(chatName, adminId, isOpened, adminsIds, membersIds) {
        let chat;
        if (await this.#collection.findOne({ chatName })) {
            throw `Collection <${chatName}> already exists`
        }
        try {
            chat = await this.#collection.insertOne({ chatName, adminsIds: [adminId, ...adminsIds], isOpened, membersIds, blockedIds: [], waitingIds: [] });
        } catch (error) {
            // if (error.code == 11000) {
            //     account = null;
            // } else {
            throw error;
            // }
        }
        return chat;
    }

    async updateChat(chatName, adminId, isOpened, adminsIds, membersIds) {
        if (!adminsIds.includes(adminId)) {
            adminsIds.push(adminId)
        }
        let chat;
        if (!await this.#collection.findOne({ chatName })) {
            throw `Chat not found`
        }
        try {
            chat = await this.#collection.updateOne({ chatName }, { $set: { adminsIds, isOpened, membersIds } });
        } catch (error) {
            // if (error.code == 11000) {
            //     account = null;
            // } else {
            throw error;
            // }
        }
        return chat;
    }

    async deleteChat() {

    }

    async addUserToChat(chatName, username, role) {
        if (!await this.#collection.findOne({ chatName })) {
            throw `Collection <${chatName}> not found`
        }
        let res
        try {
            res = await this.#collection.updateOne({ chatName }, role == "admin" ? { $push: { adminsIds: username } } : { $push: { membersIds: username } })
        } catch (error) {
            throw error
        }
        return res;
    }

    async deleteUserFromChat(chatName, username, role) {
        if (!await this.#collection.findOne({ chatName })) {
            throw `Collection <${chatName}> not found`
        }
        let res
        try {
            // res = await this.#collection.updateOne({ chatName }, role == "admin" ? { $pull: { adminsIds: username } } : { $pull: { membersIds: username } })
            res = await this.#collection.updateOne({ chatName }, { $pull: { adminsIds: username, membersIds: username } })
        } catch (error) {
            throw error
        }
        return res;
    }

    async requestAccessToChat(chatName, username) {
        if (!await this.#collection.findOne({ chatName })) {
            throw `Collection <${chatName}> not found`
        }
        let res
        try {
            res = await this.#collection.updateOne({ chatName }, { $push: { waitingIds: username } })
        } catch (error) {
            throw error
        }
        return res;
    }

    async setAccessToChat(decision, chatName, users) {
        const collection = await this.#collection.findOne({ chatName })
        if (!collection) {
            throw `Collection <${chatName}> not found`
        }
        let result = await this.#collection.updateOne({ chatName }, { $pull: { waitingIds: { $in: users } } })
        if (decision) {
            result = await this.#collection.updateOne({ chatName }, { $push: { membersIds: { $each: users } } })
        }
        return result
    }

    async chatDetails(chatName) {
        if (!await this.#collection.findOne({ chatName })) {
            throw `Collection <${chatName}> not found`
        }
        const chat = await this.#collection.findOne({ chatName })
        return chat;
    }

    async getUserGroups(username) {
        let res = this.#collection.find({ $or: [{ membersIds: username }, { adminsIds: username }] })
        res = await res.toArray();
        return res
    }

}