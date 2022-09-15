import { LogService } from "../services/LogService/LogService";
import { LogType } from "../services/LogService/LogTypeEnum";
const tracesModel = require('../models/tracesModel');

exports.saveNewTrace = async (newTrace: any) => {
    const _logService: LogService = new LogService();
    try {
        await newTrace.save();
    } catch (error) {
        _logService.log("Error de BBDD, en saveNewTrace. ERROR: " + error, LogType.Error);
    }
}

exports.getAllTraces = async () => {
    const _logService: LogService = new LogService();
    let allTraces = null;
    try {
        allTraces = await tracesModel.find();
    } catch (error) {
        _logService.log("Error de BBDD, en getAllTraces. ERROR: " + error, LogType.Error);
    }

    return allTraces;
}