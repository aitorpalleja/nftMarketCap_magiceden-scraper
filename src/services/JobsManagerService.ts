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

    constructor() {
        this._collectionsHelper = new CollectionsHelper();
        this._logService = new LogService();
    }

    public startJobs = () => {
        this._startGetAllCollectionsJob();
        this._startGetAllCollectionsStatsDataJob();
    }

    private _startGetAllCollectionsJob = () => {
        try {
            const recurrenceRule: any = new schedule.RecurrenceRule();
            recurrenceRule.hour = 0;
            recurrenceRule.minute = 0;
            recurrenceRule.tz = 'Etc/UTC';

            const job = schedule.scheduleJob(recurrenceRule, () => {
                const startTime: number = Date.now() / 1000;
                this._logService.log(this._getAllCollectionsJobStartLog, LogType.Information);
                this._collectionsHelper.getAllCollections().then(result => {
                    this._manageGetAllCollectionsJobResult(startTime, result);
                }).catch(error => {
                    this._manageGetAllCollectionsJobError(error);
                });
            });
        } catch (error) {
            this._manageGetAllCollectionsJobError(error);
        }
    }

    private _manageGetAllCollectionsJobResult = (startTime: number, result: any) => {
        const endTime: string = (Date.now() / 1000 - startTime).toFixed(2) + " segundos";
        if (result?.AllCollectionsLength !== undefined && result?.AllCollectionsLength !== null && result?.NewCollectionsLength !== undefined && result?.NewCollectionsLength !== null) {
            this._logService.log(this._getAllCollectionsJobEndLog + "TIME: " + endTime + ". NewCollectionsLength: " + result.NewCollectionsLength + ". AllCollectionsLength: " + result.AllCollectionsLength, LogType.Information);
        } else {
            this._logService.log(this._getAllCollectionsJobEndLog + "With ERRORS", LogType.Error);
            this._logService.log(this._getAllCollectionsJobErrorLog + "Result no correct. TIME: " + endTime + ". NewCollectionsLength: " + result?.NewCollectionsLength + ". AllCollectionsLength: " + result?.AllCollectionsLength, LogType.Error);
        }
    }

    private _manageGetAllCollectionsJobError = (error: any) => {
        this._logService.log(this._getAllCollectionsJobEndLog + "With ERRORS", LogType.Error);
        this._logService.log(this._getAllCollectionsJobErrorLog + error, LogType.Error);
    }

    private _startGetAllCollectionsStatsDataJob = () => {
        const job = schedule.scheduleJob('0 */6 * * *', () => {
            this._collectionsHelper.getAllCollectionsStatsData();
        });
    }
}