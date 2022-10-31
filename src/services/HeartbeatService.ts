import settings from '../../settings.json'
import { LogService } from "./LogService/LogService";
import { LogType } from "./LogService/LogTypeEnum";

export class HeartBeatService { 
    private _logService: LogService;
    private _hearBeatLog: string = "Hearbeat. Scrapper awake.";

    constructor() {
    }

    public startHeartBeat = (): void => {
        setInterval(() => {
            if (settings.Heartbeat.Enable)
            {
                this._log();
            }
        }, settings.Heartbeat.IntervalTime);
    }

    private _log = (): void => {
        this._logService.log(this._hearBeatLog, LogType.Information);
    }
}