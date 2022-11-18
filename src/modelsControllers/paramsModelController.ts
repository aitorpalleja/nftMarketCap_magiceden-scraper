import { LogService } from "../services/LogService/LogService";
import { LogType } from "../services/LogService/LogTypeEnum";
const paramsModel = require('../models/paramsModel');
const _logService: LogService = new LogService();

exports.getAllParams = async () => {
    let allParams = null;
    try {
        allParams = await paramsModel.find();
    } catch (error) {
        _logService.log("Error de BBDD, en getAllParams. ERROR: " + error, LogType.Error);
    }

    return allParams;
}

exports.getParamByName = async (paramName: string) => {
    let param = null;
    try {
        param = await paramsModel.find({Name: paramName});
    } catch (error) {
        _logService.log("Error de BBDD, en getParamByName. ERROR: " + error, LogType.Error);
    }

    return param;
}