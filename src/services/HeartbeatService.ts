import settings from '../../settings.json'
import { LogService } from "./LogService/LogService";
import { LogType } from "./LogService/LogTypeEnum";

export class HeartBeatService { 
    private _logService: LogService;
    private _hearBeatLog: string = "Hearbeat. Scrapper awake.";

    constructor() {
        this._logService = new LogService();
    }

    public startHeartBeat = (): void => {
        setInterval(() => {
            try {
                if (settings.Heartbeat.Enable)
                {
                    this._log();
                } 
            } catch (error) {
                this._logService.log("Error Hearbeat interval log. Error: " + error, LogType.Error)
            }
        }, settings.Heartbeat.IntervalTime);
    }

    private _log = (): void => {
        this._logService.log(this._hearBeatLog, LogType.Information);
    }
}