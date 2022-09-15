import { LogService } from "../services/LogService/LogService";
import { LogType } from "../services/LogService/LogTypeEnum";
const collectionModel = require('../models/collectionsModel');
const collectionsStatsModel = require('../models/collectionsStatsModel');
const _logService: LogService = new LogService();

exports.getAllCollections = async () => {
    let allCollections = null;
    try {
        allCollections = await collectionModel.find();
    } catch (error) {
        _logService.log("Error de BBDD, en getAllCollections. ERROR: " + error, LogType.Error);
    }

    return allCollections;
}

exports.getAllCollectionsStats = async () => {
    let allCollectionsStats = null;
    try {
        allCollectionsStats = await collectionsStatsModel.find();
    } catch (error) {
        _logService.log("Error de BBDD, en getAllCollectionsStats. ERROR: " + error, LogType.Error);
    }

    return allCollectionsStats;
}

exports.saveNewCollection = async (newCollection: any) => {
    try {
        await newCollection.save();
    } catch (error) {
        _logService.log("Error de BBDD, en saveNewCollection. ERROR: " + error, LogType.Error);
    }
}

exports.saveNewCollectionStats = async (newCollectionStats: any) => {
    try {
        await newCollectionStats.save();
    } catch (error) {
        _logService.log("Error de BBDD, en saveNewCollectionStats. ERROR: " + error, LogType.Error);
    }
}

exports.updateOneCollectionStatsVolumenAll = async (newCollectionStats: any) => {
    try {
        await newCollectionStats.updateOne({'Symbol': newCollectionStats.Symbol},{$set:{'VolumenAll': newCollectionStats.VolumenAll}})
    } catch (error) {
        _logService.log("Error de BBDD, en updateOneCollectionStatsVolumenAll. ERROR: " + error, LogType.Error);
    }
}