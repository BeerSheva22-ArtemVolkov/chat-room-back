export default class ChatRoom {
    
    #clients; //<client name>: <array of connections ids> // это объект в котором ключ - имя клиента
    #connections;//<connection id>: {client: <clientName>, socket: <web socket>}
    
    constructor() {
        this.#clients = {};
        this.#connections = {};
    }

    addConnection(clientName, connectionId, ws) {
        this.#connections[connectionId] = { client: clientName, socket: ws };//[connectionId] - поле
        if (this.#clients[clientName]) {
            this.#clients[clientName].push(connectionId);//мб несколько соединений с разных устройств
        } else {
            this.#clients[clientName] = [connectionId];//добавляем [clientName], добавляем поле connections, строим новый массив и кладем в него connectionId
        }
    }

    removeConnection(connectionId) {
        const clientName = this.#connections[connectionId].client;
        const clientConnections = this.#clients[clientName];
        const index = clientConnections.findIndex(id => id == connectionId);
        if (index < 0) {
            throw `illegal state with connection ${connectionId}`
        }
        clientConnections.splice(index, 1);//удалить 1 элемент
        if (clientConnections.length == 0) {
            delete this.#clients[clientName];//если его массив соединений 0 то удаляем его
        }
        delete this.#connections[connectionId];
    }

    getClientWebSockets(clientName) {//=getConnections
        let res = [];
        if (this.#clients[clientName]) {
            res = this.#clients[clientName].map(connectionId => this.#connections[connectionId].socket);//преобразоваываем из массива connections в массив socket
        }
        return res;
    }

    getClientsWebSockets(clientsNames) {
        return Object.values(this.#connections).filter(con => clientsNames.includes(con.client)).map(c => c.socket)
    }

    getClients() {
        return Object.keys(this.#clients);
    }

    getAllWebSockets() {
        return Object.values(this.#connections).map(c => c.socket)
    }

}