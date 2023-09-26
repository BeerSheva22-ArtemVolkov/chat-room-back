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

export default class UsersService {

    #collection

    constructor() {
        // const connection_string = process.env[config.get(MONGO_ENV_URI)];
        // const dbName = config.get(MONGO_DB_NAME);
        const connection_string = `mongodb+srv://root:artem1234@cluster0.oinopsu.mongodb.net/${dbName}?retryWrites=true&w=majority`
        const connection = new MongoConnection(connection_string, dbName);
        this.#collection = connection.getCollection('users');
    }

    async addAccount(account) {
        const accountDB = await toAccountDB(account)
        try {
            await this.#collection.insertOne(accountDB);
        } catch (error) {
            if (error.code == 11000) {
                account = null;
            } else {
                throw error;
            }
        }
        return account;
    }

    async getAccount(username) {
        const document = await this.#collection.findOne({ _id: username });
        return document == null ? null : toAccount(document);
    }

    async login(loginData) {
        const account = await this.getAccount(loginData.username);
        let accessToken;
        if (account && await bcrypt.compare(loginData.password, account.passwordHash)) {
            accessToken = getJwt(account.username, account.roles);
        }
        return accessToken;
    }

    async getAllUsers() {
        let users = this.#collection.find({});
        users = await users.toArray();
        return users.map(user => {
            return user._id
        });
    }

}

function getJwt(username, roles) {
    // return jwt.sign({ roles }, process.env[config.get(ENV_JWT_SECRET)], {
    return jwt.sign({ roles }, JWT_SECRET, {
        // expiresIn: config.get('jwt.expiresIn'),
        expiresIn: expiresIn,
        subject: username
    })
}

function toAccount(accountdb) {
    const res = { username: accountdb._id, roles: accountdb.roles, passwordHash: accountdb.passwordHash };
    return res;
}

async function toAccountDB(account) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    const res = { _id: account.username, passwordHash, roles: account.roles };
    return res;
}