import { LogService } from "./LogService/LogService";
import { LogType } from "./LogService/LogTypeEnum";

const mongoose = require('mongoose');

export class ParamsManagerService {
    private _database: any;
    private _logService: LogService;

    constructor() {
        this._database = undefined;
        this._logService = new LogService();
    }

    public getParameters = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            this._connectToDBAndControlConnection().then(result => {
                this._getParameters();
                resolve(result);
            }).catch(error => {
                reject(error);
            });
        });
    }

    private _connectToDBAndControlConnection = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            this._connectToDB();
            this._controlConnection().then(result => {
                resolve(result)
            }).catch(err => {
                reject(err)
            });
        })
    }

    private _connectToDB = () => {
        const connectionOptions = {
            socketTimeoutMS: 0,
            keepAlive: true,
            useNewUrlParser: true
        };
        
        mongoose.connect(process.env.MONGO_DB_URI, connectionOptions);
        this._database = mongoose.connection;
    }

    private _controlConnection = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            this._database.on('error', (error) => {
                this._logService.log("ERROR conecting to DataBase: " + error, LogType.Error);
                reject(false);
            });

            this._database.once('open', () => {
                this._logService.log("Connected to Database", LogType.Information);
                resolve(true);
            });
        });
    }

    private _getParameters = () => {
        // TODO: Get config parameters (BBDD)
    }
}
