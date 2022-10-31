const mongoose = require('mongoose');
import { LogService } from "./LogService/LogService";
import { LogType } from "./LogService/LogTypeEnum";
import settings from '../../settings.json';
const paramsController = require('../modelsControllers/paramsModelController');

export class ParamsManagerService {
    private _database: any;
    private _logService: LogService;

    constructor() {
        this._database = undefined;
        this._logService = new LogService();
    }

    public getParameters = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            this._connectToDBAndControlConnection().then(async (result: boolean) => {
                await this._getAndSetParameters();
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

    private _getAndSetParameters = async() => {
        let params: any;
        try {
            params = await paramsController.getAllParams();
            this._setSettingParameters(params);
            this._logService.log("Parametros obtenidos de BBDD", LogType.Information);
        } catch (error) {
            this._logService.log("Error parametros obtenidos de BBDD _getAndSetParameters. Error: " + error, LogType.Error);
        }

        this._startGetParamsInterval();
        return params;
    }

    private _startGetParamsInterval = async() => {
        setInterval(async () => {
            try {
                const params: any = await paramsController.getAllParams();
                this._setSettingParameters(params);
                this._logService.log("Parametros obtenidos de BBDD", LogType.Information);
            } catch (error) {
                this._logService.log("Error parametros obtenidos de BBDD _startGetParamsInterval. Error: " + error, LogType.Error);
            }
            
        }, settings.Params.ParamsRequestTime)
    }

    private _setSettingParameters = (parameters) => {
        settings.JobsManager.DeleteAllTracesJobEnable = parameters.find(param => param.Name === "JobsManager.DeleteAllTracesJobEnable") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.DeleteAllTracesJobEnable").Value : 
            settings.JobsManager.DeleteAllTracesJobEnable;

        settings.JobsManager.DeleteAllTracesJobTime = parameters.find(param => param.Name === "JobsManager.DeleteAllTracesJobTime") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.DeleteAllTracesJobTime").Value : 
            settings.JobsManager.DeleteAllTracesJobTime;
        
        settings.JobsManager.GetAllCollectionsJobEnable = parameters.find(param => param.Name === "JobsManager.GetAllCollectionsJobEnable") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.GetAllCollectionsJobEnable").Value : 
            settings.JobsManager.GetAllCollectionsJobEnable;
        
        settings.JobsManager.GetAllCollectionsJobTime = parameters.find(param => param.Name === "JobsManager.GetAllCollectionsJobTime") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.GetAllCollectionsJobTime").Value : 
            settings.JobsManager.GetAllCollectionsJobTime;

        settings.JobsManager.GetAllCollectionsStatsDataJobEnable = parameters.find(param => param.Name === "JobsManager.GetAllCollectionsStatsDataJobEnable") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.GetAllCollectionsStatsDataJobEnable").Value : 
            settings.JobsManager.GetAllCollectionsStatsDataJobEnable;

        settings.JobsManager.GetAllCollectionsStatsDataJobTime = parameters.find(param => param.Name === "JobsManager.GetAllCollectionsStatsDataJobTime") !== undefined ? 
            parameters.find(param => param.Name === "JobsManager.GetAllCollectionsStatsDataJobTime").Value : 
            settings.JobsManager.GetAllCollectionsStatsDataJobTime;

        settings.Logs.BBDDLogsEnable = parameters.find(param => param.Name === "Logs.BBDDLogsEnable") !== undefined ? 
            parameters.find(param => param.Name === "Logs.BBDDLogsEnable").Value : 
            settings.Logs.BBDDLogsEnable;

        settings.Logs.ConsoleLogsEnable = parameters.find(param => param.Name === "Logs.ConsoleLogsEnable") !== undefined ? 
            parameters.find(param => param.Name === "Logs.ConsoleLogsEnable").Value : 
            settings.Logs.ConsoleLogsEnable;
        
        settings.Collections.MinVolumenExpiredCollections = parameters.find(param => param.Name === "Collections.MinVolumenExpiredCollections") !== undefined ? 
            parameters.find(param => param.Name === "Collections.MinVolumenExpiredCollections").Value : 
            settings.Collections.MinVolumenExpiredCollections;
        
        settings.Collections.CollectionLengthForUniqueHoldersAndSupplyDataScrap = parameters.find(param => param.Name === "Collections.CollectionLengthForUniqueHoldersAndSupplyDataScrap") !== undefined ? 
            parameters.find(param => param.Name === "Collections.CollectionLengthForUniqueHoldersAndSupplyDataScrap").Value : 
            settings.Collections.CollectionLengthForUniqueHoldersAndSupplyDataScrap;

        settings.Collections.NumberOfCollectionsToScrapDetailedData = parameters.find(param => param.Name === "Collections.NumberOfCollectionsToScrapDetailedData") !== undefined ? 
            parameters.find(param => param.Name === "Collections.NumberOfCollectionsToScrapDetailedData").Value : 
            settings.Collections.NumberOfCollectionsToScrapDetailedData;

        settings.Heartbeat.Enable = parameters.find(param => param.Name === "Heartbeat.Enable") !== undefined ? 
            parameters.find(param => param.Name === "Heartbeat.Enable").Value : 
            settings.Heartbeat.Enable;
        
        settings.Heartbeat.IntervalTime = parameters.find(param => param.Name === "Heartbeat.IntervalTime") !== undefined ? 
            parameters.find(param => param.Name === "Heartbeat.IntervalTime").Value : 
            settings.Heartbeat.IntervalTime;
        
        settings.Puppeteer.Enable = parameters.find(param => param.Name === "Puppeteer.Enable") !== undefined ? 
            parameters.find(param => param.Name === "Puppeteer.Enable").Value : 
            settings.Puppeteer.Enable;

        settings.Puppeteer.Headless = parameters.find(param => param.Name === "Puppeteer.Headless") !== undefined ? 
            parameters.find(param => param.Name === "Puppeteer.Headless").Value : 
            settings.Puppeteer.Headless;

        settings.Params.ParamsRequestTime = parameters.find(param => param.Name === "Params.ParamsRequestTime") !== undefined ? 
            parameters.find(param => param.Name === "Params.ParamsRequestTime").Value : 
            settings.Params.ParamsRequestTime;
    }
}
