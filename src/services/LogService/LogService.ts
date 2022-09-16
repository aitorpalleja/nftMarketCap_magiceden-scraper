import { LogType } from "./LogTypeEnum";
const tracesController = require('../../modelsControllers/tracesModelController');
const tracesModel = require('../../models/tracesModel');

export class LogService {
  constructor() {}

  public log = (trace: string, logType: LogType) => {
    const currentDate: Date = new Date(); 
    const dateTimeString: string = "Date: " + currentDate.getDate() + "/"
                                  + (currentDate.getMonth()+1)  + "/" 
                                  + currentDate.getFullYear() + " @ "  
                                  + currentDate.getHours() + ":"  
                                  + currentDate.getMinutes() + ":" 
                                  + currentDate.getSeconds();

    const newTraceModel = tracesModel({
      Trace: trace.substring(0,1000),
      LogType: LogType[logType],
      Date: dateTimeString.substring(0,50),
    });

    tracesController.saveNewTrace(newTraceModel);
    if (logType === LogType.Information) {
      console.log(trace);
    } else {
      console.warn(trace);
    }
  }

  public deleteAllTraces = async() => {
    await tracesController.deleteAllTraces();
  }
}
