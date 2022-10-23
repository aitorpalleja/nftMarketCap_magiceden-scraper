const schedule = require('node-schedule');
import { CollectionsHelper } from '../helpers/collectionsHelper';
import { LogService } from './LogService/LogService';
import { LogType } from './LogService/LogTypeEnum';
import { JobsModel } from './Jobs.model';

export class JobsManagerService {
    private _collectionsHelper: CollectionsHelper;
    private _logService: LogService;

    private _allCollectionsJob: JobsModel = {
        Working: false,
        Pending: false,
        StartLog: "START _startGetAllCollectionsJob. ",
        EndLog: "END _startGetAllCollectionsJob. ",
        ErrorLog: "Error JobsManagerService --> _startGetAllCollectionsJob. ERROR: ",
    };
    
    private _allCollectionsStatsDataJob: JobsModel = {
        Working: false,
        Pending: false,
        StartLog: "START _startGetAllCollectionsStatsDataJob. ",
        EndLog: "END _startGetAllCollectionsStatsDataJob. ",
        ErrorLog: "Error JobsManagerService --> _startGetAllCollectionsStatsDataJob. ERROR: ",
    };

    constructor() {
        this._collectionsHelper = new CollectionsHelper();
        this._logService = new LogService();
    }

    public startJobs = async() => {
        await this._getAllCollectionsJob();
        await this._getAllCollectionsStatsDataJob();
        this._startScheduleJobs();
    }

    private _startScheduleJobs = (): void => {
        this._startGetAllCollectionsJob();
        this._startGetAllCollectionsStatsDataJob();
        this._startDeleteAllTracesJob();
    }

    private _startDeleteAllTracesJob = (): void => {
        try {
            // Cada 96 horas (4 días)
            const job: any = schedule.scheduleJob('0 */96 * * *', () => {
                this._deleteAllTracesJob();
            });
        } catch (error) {
        }
    }

    private _deleteAllTracesJob = async (): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            await this._logService.deleteAllTraces()
            resolve(true);
        })
    }

    private _startGetAllCollectionsJob = (): void => {
        try {
            // Cada 3 horas
            const job: any = schedule.scheduleJob('0 */3 * * *', () => {
                if (this._allCollectionsStatsDataJob.Working) {
                    this._allCollectionsJob.Pending = true;
                } else {
                    this._allCollectionsJob.Working = true;
                    this._getAllCollectionsJob();
                }
            });
        } catch (error) {
            this._manageGetAllCollectionsJobError(error);
        }
    }

    private _getAllCollectionsJob = (): Promise<boolean> => {
        const startTime: number = Date.now() / 1000;
        this._logService.log(this._allCollectionsJob.StartLog, LogType.Information);
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

    private _manageGetAllCollectionsJobResult = (startTime: number, result: any): void => {
        this._allCollectionsJob.Working = false;
        const endTime: string = (Date.now() / 1000 - startTime).toFixed(2) + " segundos";
        const dataTrace: string = "TIME: " + endTime + ". NewCollectionsLength: " + result?.NewCollectionsLength + ". AllCollectionsLength: " + result?.AllCollectionsLength;
        if (result?.AllCollectionsLength !== undefined && result?.AllCollectionsLength !== null && result?.NewCollectionsLength !== undefined && result?.NewCollectionsLength !== null) {
            this._logService.log(this._allCollectionsJob.EndLog + dataTrace, LogType.Information);
        } else {
            this._logService.log(this._allCollectionsJob.EndLog + "With ERRORS", LogType.Error);
            this._logService.log(this._allCollectionsJob.ErrorLog + "Result no correct. " + dataTrace, LogType.Error);
        }

        this._manageGetAllCollectionsStatsDataPendingJobs();
    }

    private _manageGetAllCollectionsJobError = (error: any): void => {
        this._allCollectionsJob.Working = false;
        this._logService.log(this._allCollectionsJob.EndLog + "With ERRORS", LogType.Error);
        this._logService.log(this._allCollectionsJob.ErrorLog + error, LogType.Error);
        
        this._manageGetAllCollectionsStatsDataPendingJobs();
    }

    private _manageGetAllCollectionsPendingJobs(): void {
        if (this._allCollectionsJob.Pending && !this._allCollectionsJob.Working && !this._allCollectionsStatsDataJob.Working) {
            this._allCollectionsJob.Pending = false;
            this._getAllCollectionsJob();
        }
    }

    private _startGetAllCollectionsStatsDataJob = (): void => {
        try {
            // En el minuto 10 cada 8 horas
            const job: any = schedule.scheduleJob('10 */8 * * *', () => {
                if (this._allCollectionsJob.Working) {
                    this._allCollectionsStatsDataJob.Pending = true;
                } else {
                    this._allCollectionsStatsDataJob.Working = true;
                    this._getAllCollectionsStatsDataJob();
                }
            });
        }
        catch(error) {
            this._manageGetAllCollectionsStatsDataJobError(error);
        }
    }

    private _getAllCollectionsStatsDataJob = (): Promise<boolean> => {
        const startTime: number = Date.now() / 1000;
        this._logService.log(this._allCollectionsStatsDataJob.StartLog, LogType.Information);
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

    private _manageGetAllCollectionsStatsDataJobResult = (startTime: number, result: any): void => {
        this._allCollectionsStatsDataJob.Working = false;
        const endTime: string = (Date.now() / 1000 - startTime).toFixed(2) + " segundos";
        const dataTrace: string = "TIME: " + endTime + ". ActiveCollectionsLength: " + result?.ActiveCollectionsLength + ". CollectionsUpdated: " + result?.CollectionsUpdated;
        if (result?.ActiveCollectionsLength !== undefined && result?.ActiveCollectionsLength !== null && result?.CollectionsUpdated !== undefined && result?.CollectionsUpdated !== null) {
            this._logService.log(this._allCollectionsStatsDataJob.EndLog + dataTrace, LogType.Information);
        } else {
            this._logService.log(this._allCollectionsStatsDataJob.EndLog + "With ERRORS", LogType.Error);
            this._logService.log(this._allCollectionsStatsDataJob.ErrorLog + "Result no correct. " + dataTrace, LogType.Error);
        }

        this._manageGetAllCollectionsPendingJobs();
    }

    private _manageGetAllCollectionsStatsDataJobError = (error: any): void => {
        this._allCollectionsStatsDataJob.Working = false;
        this._logService.log(this._allCollectionsStatsDataJob.EndLog + "With ERRORS", LogType.Error);
        this._logService.log(this._allCollectionsStatsDataJob.ErrorLog + error, LogType.Error);

        this._manageGetAllCollectionsPendingJobs();
    }

    private _manageGetAllCollectionsStatsDataPendingJobs(): void {
        if (this._allCollectionsStatsDataJob.Pending && !this._allCollectionsStatsDataJob.Working && !this._allCollectionsJob.Working) {
            this._allCollectionsStatsDataJob.Pending = false;
            this._getAllCollectionsStatsDataJob();
        }
    }
}