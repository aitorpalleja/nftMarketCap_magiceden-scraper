import { PuppeteerService } from '../services/PuppeteerService';
import settings from '../../settings.json'
import { GetAllCollectionsJobResult } from '../services/JobsManagerService/GetAllCollectionsJobResult';
import { GetAllCollectionsStatsJobResult } from '../services/JobsManagerService/GetAllCollectionsStatsJobResult';
const collectionsController = require('../modelsControllers/collectionsModelController');
const collectionModel = require('../models/collectionsModel');
const collectionsStatsModel = require('../models/collectionsStatsModel');

export class CollectionsHelper { 
    private _puppeterService: PuppeteerService;
    private _collectionsSaved: number = 0;

    constructor() {
        this._puppeterService = new PuppeteerService();
        this._collectionsSaved = 0;
    }

    public getAllCollections = (): Promise<GetAllCollectionsJobResult> => {
        return new Promise((resolve, reject) => {
            const errorLog: string = "Error collectionsHelper --> getAllCollections. Error: ";
            let allCollections: any = [];
            let popularCollections: any = [];
            let newCollections: any = [];
            let savedCollections: any = [];
            this._collectionsSaved = 0;
            
            this._puppeterService.scrapAllCollectionsData().then(async (data: any) => {
                if (data !== null) {
                    try {
                        allCollections = data;
                        popularCollections = await this._getPopularCollections();
                        const newAndSavedCollections = await this._getNewAndSavedCollections(allCollections);
                        newCollections = newAndSavedCollections[0];
                        savedCollections = newAndSavedCollections[1];
                        const savedAllCollectionsStats: any = await collectionsController.getAllCollectionsStats();
                        await this._getAndSaveNewCollectionsData(newCollections, savedAllCollectionsStats, popularCollections);
                        await this._updateSavedCollectionsExpiredProperty(savedCollections, popularCollections);
                        resolve({ NewCollectionsToSave: newCollections.length-1, NewCollectionsSaved: this._collectionsSaved, AllCollections: allCollections.length })
                    } catch (error) {
                        reject(errorLog + error);
                    }
                } else {
                    reject(errorLog + "No data scrapped on scrapAllCollectionsData()");
                }
            }).catch((error) => {
                reject(errorLog + error);
            });
        });
    }
    
    public getAllCollectionsStatsData = (): Promise<GetAllCollectionsStatsJobResult> => {
        const errorLog: string = "Error collectionsHelper --> getAllCollectionsStatsData. Error: ";
        return new Promise(async (resolve, reject) => {
            try {
                const savedAllCollections = await collectionsController.getAllActiveCollections();
                if (savedAllCollections !== null && savedAllCollections !== undefined && savedAllCollections.length > 0) {
                    let collectionsUpdated = 0;
                    let symbolsList: string = '';
                    let symbolsCount: number = 0;
                    for (const collection of savedAllCollections) {
                        symbolsCount++;
                        symbolsList = symbolsList === '' ? collection.Symbol : symbolsList + ',' + collection.Symbol;
                        if (symbolsCount >= settings.Collections.CollectionLengthForUniqueHoldersAndSupplyDataScrap) {
                            const collectionsData: any = await this._puppeterService.scrapCollectionUniqueHoldersAndSupplyData(symbolsList);
                            if (collectionsData !== null) {
                                for (const collectionData of collectionsData) {
                                    if (collectionData !== undefined && collectionData !== null && collectionData?.symbol !== undefined) {
                                        const totalSupply = collectionData.totalSupply !== null && collectionData.totalSupply !== undefined ? collectionData.totalSupply : null;
                                        const uniqueHolders = collectionData.uniqueHolders !== null && collectionData.uniqueHolders !== undefined ? collectionData.uniqueHolders : null;      
                                        await collectionsController.updateOneCollectionStatsTotalSupplyAndHolders(collectionData, totalSupply, uniqueHolders);
                                        collectionsUpdated++;
                                    }
                                }
                            }
                            symbolsList = '';
                            symbolsCount = 0;
                        }
                    }

                    resolve({ ActiveAllCollections: savedAllCollections.length, CollectionsUpdated: collectionsUpdated });
                } else {
                    reject(errorLog + "SavedAllCollections no válidos: " + savedAllCollections);
                }
                
            } catch (error) {
                reject(errorLog + error);
            }
        });
    }

    private _getNewAndSavedCollections = async(allCollections: any) => {
        let newCollections: any = [];
        let collectionsAlreadySaved: any = [];
        const savedAllCollections: any = await collectionsController.getAllCollections();
        for (const collection of allCollections) {   
            if (collection?.symbol !== null && collection?.symbol !== undefined) {
                const collectionFinded: any = savedAllCollections.find(savedCollection => savedCollection.Symbol === collection.symbol);
                if (collectionFinded === null || collectionFinded === undefined) {
                    newCollections.push(collection);
                } else {
                    collectionsAlreadySaved.push(collection)
                }
            }          
        }

        return [newCollections, collectionsAlreadySaved];
    }

    private _getPopularCollections = async() => {
        let popularCollections: any = [];
        popularCollections = this._mergeUniqueTwoCollectionsArray(await this._puppeterService.scrapPopularCollectionsData("1h"), popularCollections, 'collectionSymbol');
        popularCollections = this._mergeUniqueTwoCollectionsArray(await this._puppeterService.scrapPopularCollectionsData("6h"), popularCollections, 'collectionSymbol');
        popularCollections = this._mergeUniqueTwoCollectionsArray(await this._puppeterService.scrapPopularCollectionsData("1d"), popularCollections, 'collectionSymbol');
        popularCollections = this._mergeUniqueTwoCollectionsArray(await this._puppeterService.scrapPopularCollectionsData("7d"), popularCollections, 'collectionSymbol');
        popularCollections = this._mergeUniqueTwoCollectionsArray(await this._puppeterService.scrapPopularCollectionsData("30d"), popularCollections, 'collectionSymbol');

        return popularCollections;
    }

    private _mergeUniqueTwoCollectionsArray = (firstCollectionArray: any, secondCollectionArray: any, symbolPropertyName: string): any => {
        for (const firstCollection of firstCollectionArray) {
            if (secondCollectionArray.find(secondCollection => secondCollection[symbolPropertyName] === firstCollection[symbolPropertyName]) === undefined) {
                secondCollectionArray.push(firstCollection);
            }
        }

        return secondCollectionArray;
    }

    private _getAndSaveNewCollectionsData = async(newCollections: any, savedAllCollectionsStats: any, popularCollections: any) => {
        for (let index = 0; index < newCollections.length; index += settings.Collections.NumberOfCollectionsToScrapDetailedData) {
            const newCollectionsDetailedData: any = await this._getNewCollectionsDetailedData(newCollections, index, settings.Collections.NumberOfCollectionsToScrapDetailedData);
            if (newCollectionsDetailedData !== null) {
                this._saveNewCollections(newCollectionsDetailedData, newCollections, savedAllCollectionsStats, popularCollections);
            }
        }
    }

    private _updateSavedCollectionsExpiredProperty = async(savedCollections: any, popularCollections: any) => {
        for (const collection of savedCollections) {
            const isPopularCollection: boolean = popularCollections.find(popularCollection => popularCollection.collectionSymbol === collection.symbol) !== undefined;
            await collectionsController.updateOneCollectionExpiredProperty(collection, !isPopularCollection && collection.volumeAll <= settings.Collections.MinVolumenExpiredCollections);
        }
    }

    private _getNewCollectionsDetailedData = async(newCollections: any, index: number, numberOfCollectionsToRequest: number) => {
        const newSymbolsList: string = this._getNewSymbolsList(newCollections, index, numberOfCollectionsToRequest);
        return await this._puppeterService.scrapCollectionListDetailedData(newSymbolsList);
    }

    private _getNewSymbolsList = (newCollections: any, index: number, numberOfCollectionsToRequest: number): string => {
        const slicedCollectionArray: any = newCollections.slice(index, index + numberOfCollectionsToRequest);
        let newSymbols: string = "[" + slicedCollectionArray.map(collection => '"' + collection.symbol + '"') + "]";
        newSymbols = newSymbols.replace(/"/gi, "%22");
        newSymbols = newSymbols.replace(/ /gi, "%20");

        return newSymbols;
    }

    private _saveNewCollections = async(newCollectionsDetailedData: any, newCollections: any, savedAllCollectionsStats: any, popularCollections: any) => {
        for (const collection of newCollectionsDetailedData) {
            if (collection !== null && collection !== undefined && collection.symbol) {
                const volumenAll: any = newCollections.find(newCollection => newCollection.symbol === collection.symbol)?.volumeAll;
                const isPopularCollection: boolean = popularCollections.find(popularCollection => popularCollection.collectionSymbol === collection.symbol) !== undefined;
                const newCollection: any = new collectionModel({
                    Symbol: collection.symbol,
                    Name: collection.name,
                    Description: collection.description,
                    Image: collection.image,
                    Website: collection.website,
                    Twitter: collection.twitter,
                    Discord: collection.discord,
                    CreatedAt: collection.createdAt,
                    UpdatedAt: collection.updatedAt,
                    Expired: (volumenAll === undefined || volumenAll === null || volumenAll <= settings.Collections.MinVolumenExpiredCollections) && !isPopularCollection
                });
                
                const newCollectionStats: any = new collectionsStatsModel({
                    Symbol: collection.symbol,
                    FloorPrice: null,
                    ListetCount: null,
                    TotalSupply: null,
                    MarketCap: null,
                    VolumenAll: volumenAll !== undefined && volumenAll !== null ? volumenAll : null,
                    UniqueHolders: null
                });
                await collectionsController.saveNewCollection(newCollection);

                let collectionStatsFinded: any = null;
                if (savedAllCollectionsStats !== null && savedAllCollectionsStats !== undefined && savedAllCollectionsStats.length > 0) {
                    collectionStatsFinded = savedAllCollectionsStats.find(savedCollectionStats => savedCollectionStats.Symbol === newCollectionStats.Symbol);
                }

                if (collectionStatsFinded === null || collectionStatsFinded === undefined) {
                    await collectionsController.saveNewCollectionStats(newCollectionStats);
                } else {
                    await collectionsController.updateOneCollectionStatsVolumenAll(newCollectionStats);
                }
                this._collectionsSaved += 1;
            }
        }
    }
}

