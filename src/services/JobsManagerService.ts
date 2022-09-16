const schedule = require('node-schedule');
import { CollectionsHelper } from '../helpers/collectionsHelper';
import { LogService } from './LogService/LogService';
import { LogType } from './LogService/LogTypeEnum';

export class JobsManagerService {
    private _collectionsHelper: CollectionsHelper;
    private _logService: LogService;

    private _getAllCollectionsJobStartLog: string = "START _startGetAllCollectionsJob. ";
    private _getAllCollectionsJobEndLog: string = "END _startGetAllCollectionsJob. ";
    private _getAllCollectionsJobErrorLog: string = "Error JobsManagerService --> _startGetAllCollectionsJob. ERROR: ";

    private _getAllCollectionsStatsDataJobStartLog: string = "START _startGetAllCollectionsStatsDataJob. ";
    private _getAllCollectionsStatsDataJobEndLog: string = "END _startGetAllCollectionsStatsDataJob. ";
    private _getAllCollectionsStatsDataJobErrorLog: string = "Error JobsManagerService --> _startGetAllCollectionsStatsDataJob. ERROR: ";

    constructor() {
        this._collectionsHelper = new CollectionsHelper();
        this._logService = new LogService();
    }

    public startJobs = async() => {
        await this._getAllCollectionsJob();
        await this._getAllCollectionsStatsDataJob();
        this._startScheduleJobs();
    }

    private _startScheduleJobs = () => {
        this._startGetAllCollectionsJob();
        this._startGetAllCollectionsStatsDataJob();
        this._startDeleteAllTracesJob();
    }

    private _startDeleteAllTracesJob = () => {
        try {
            const job = schedule.scheduleJob('0 */96 * * *', () => {
                this._deleteAllTracesJob();
            });
        } catch (error) {
        }
    }

    private _deleteAllTracesJob = async () => {
        return new Promise(async (resolve, reject) => {
            await this._logService.deleteAllTraces()
            resolve(true);
        })
    }

    private _startGetAllCollectionsJob = () => {
        try {
            const job = schedule.scheduleJob('0 */2 * * *', () => {
                this._getAllCollectionsJob();
            });
        } catch (error) {
            this._manageGetAllCollectionsJobError(error);
        }
    }

    private _getAllCollectionsJob = () => {
        const startTime: number = Date.now() / 1000;
        this._logService.log(this._getAllCollectionsJobStartLog, LogType.Information);
        return new Promise((resolve, reject) => {
            this._collectionsHelper.getAllCollections().then(result => {
                this._manageGetAllCollectionsJobResult(startTime, result);
                resolve(true);
            }).catch(error => {
                this._manageGetAllCollectionsJobError(error);
                reject(false)
            });
        })
    }

    private _manageGetAllCollectionsJobResult = (startTime: number, result: any) => {
        const endTime: string = (Date.now() / 1000 - startTime).toFixed(2) + " segundos";
        const dataTrace: string = "TIME: " + endTime + ". NewCollectionsLength: " + result?.NewCollectionsLength + ". AllCollectionsLength: " + result?.AllCollectionsLength;
        if (result?.AllCollectionsLength !== undefined && result?.AllCollectionsLength !== null && result?.NewCollectionsLength !== undefined && result?.NewCollectionsLength !== null) {
            this._logService.log(this._getAllCollectionsJobEndLog + dataTrace, LogType.Information);
        } else {
            this._logService.log(this._getAllCollectionsJobEndLog + "With ERRORS", LogType.Error);
            this._logService.log(this._getAllCollectionsJobErrorLog + "Result no correct. " + dataTrace, LogType.Error);
        }
    }

    private _manageGetAllCollectionsJobError = (error: any) => {
        this._logService.log(this._getAllCollectionsJobEndLog + "With ERRORS", LogType.Error);
        this._logService.log(this._getAllCollectionsJobErrorLog + error, LogType.Error);
    }

    private _startGetAllCollectionsStatsDataJob = () => {
        try {
            const job = schedule.scheduleJob('0 */6 * * *', () => {
                this._getAllCollectionsStatsDataJob();
            });
        }
        catch(error) {
            this._manageGetAllCollectionsStatsDataJobError(error);
        }
    }

    private _getAllCollectionsStatsDataJob = () => {
        const startTime: number = Date.now() / 1000;
        this._logService.log(this._getAllCollectionsStatsDataJobStartLog, LogType.Information);
        return new Promise((resolve, reject) => {
            this._collectionsHelper.getAllCollectionsStatsData().then(result => {
                this._manageGetAllCollectionsStatsDataJobResult(startTime, result);
                resolve(true);
            }).catch(error => {
                this._manageGetAllCollectionsStatsDataJobError(error);
                reject(false)
            });
        })
    }

    private _manageGetAllCollectionsStatsDataJobResult = (startTime: number, result: any) => {
        const endTime: string = (Date.now() / 1000 - startTime).toFixed(2) + " segundos";
        const dataTrace: string = "TIME: " + endTime + ". ActiveCollectionsLength: " + result?.ActiveCollectionsLength + ". CollectionsUpdated: " + result?.CollectionsUpdated;
        if (result?.ActiveCollectionsLength !== undefined && result?.ActiveCollectionsLength !== null && result?.CollectionsUpdated !== undefined && result?.CollectionsUpdated !== null) {
            this._logService.log(this._getAllCollectionsStatsDataJobEndLog + dataTrace, LogType.Information);
        } else {
            this._logService.log(this._getAllCollectionsStatsDataJobEndLog + "With ERRORS", LogType.Error);
            this._logService.log(this._getAllCollectionsStatsDataJobErrorLog + "Result no correct. " + dataTrace, LogType.Error);
        }
    }

    private _manageGetAllCollectionsStatsDataJobError = (error: any) => {
        this._logService.log(this._getAllCollectionsStatsDataJobEndLog + "With ERRORS", LogType.Error);
        this._logService.log(this._getAllCollectionsStatsDataJobErrorLog + error, LogType.Error);
    }
}