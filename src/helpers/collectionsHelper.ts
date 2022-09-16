import { PuppeteerService } from '../services/PuppeteerService';
const collectionsController = require('../modelsControllers/collectionsModelController');
const collectionModel = require('../models/collectionsModel');
const collectionsStatsModel = require('../models/collectionsStatsModel');

export class CollectionsHelper { 
    private _puppeterService: PuppeteerService;

    constructor() {
        this._puppeterService = new PuppeteerService();
    }

    public getAllCollections = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            const errorLog: string = "Error collectionsHelper --> getAllCollections. Error: ";
            let newCollections: any = [];
            let allCollections: any = [];
            
            this._puppeterService.scrapAllCollectionsData().then(async (data: any) => {
                if (data !== null) {
                    try {
                        allCollections = data;
                        newCollections = await this._getNewCollections(allCollections);
                        const savedAllCollectionsStats: any = await collectionsController.getAllCollectionsStats();
                        await this._getAndSaveNewCollectionsData(newCollections, savedAllCollectionsStats);
                        resolve({ NewCollectionsLength: newCollections.length, AllCollectionsLength: allCollections.length })
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
    
    public getAllCollectionsStatsData = (): Promise<any> => {
        const errorLog: string = "Error collectionsHelper --> getAllCollectionsStatsData. Error: ";
        return new Promise(async (resolve, reject) => {
            try {
                const savedAllCollections = await collectionsController.getCollectionsStatsWithVolumenGraterT100();
                if (savedAllCollections !== null && savedAllCollections !== undefined && savedAllCollections.length > 0) {
                    let collectionsUpdated = 0;
                    let symbolsList: string = '';
                    let symbolsCount: number = 0;
                    for (const collection of savedAllCollections) {
                        symbolsCount++;
                        symbolsList = symbolsList === '' ? collection.Symbol : symbolsList + ',' + collection.Symbol;
                        if (symbolsCount >= 2) {
                            const collectionsData: any = await this._puppeterService.scrapCollectionUniqueHoldersAndSupplyData(symbolsList);
                            if (collectionsData !== null) {
                                for (const collectionData of collectionsData) {
                                    if (collectionData !== undefined && collectionData !== null && collectionData?.symbol !== undefined) {
                                        const totalSupply = collectionData.totalSupply !== null && collectionData.totalSupply !== undefined ? collectionData.totalSupply : null;
                                        const uniqueHolders = collectionData.uniqueHolders !== null && collectionData.uniqueHolders !== undefined ? collectionData.uniqueHolders : null;
                                        await collectionsStatsModel.updateOne({'Symbol': collectionData.symbol},{$set:{'TotalSupply': totalSupply, 'UniqueHolders': uniqueHolders }});
                                        collectionsUpdated++;
                                    }
                                }
                            }
                            symbolsList = '';
                            symbolsCount = 0;
                        }
                    }

                    resolve({ ActiveCollectionsLength: savedAllCollections.length, CollectionsUpdated: collectionsUpdated });
                } else {
                    reject(errorLog + "SavedAllCollections no válidos: " + savedAllCollections);
                }
                
            } catch (error) {
                reject(errorLog + error);
            }
        });
    }

    private _getNewCollections = async(allCollections: any) => {
        let newCollections: any = [];
        const savedAllCollections: any = await collectionsController.getAllCollections();
        for (const collection of allCollections) {   
            if (collection?.symbol !== null && collection?.symbol !== undefined) {
                const collectionFinded: any = savedAllCollections.find(savedCollection => savedCollection.Symbol === collection.symbol);
                if (collectionFinded === null || collectionFinded === undefined) {
                    newCollections.push(collection);
                }
            }          
        }

        return newCollections;
    }

    private _getAndSaveNewCollectionsData = async(newCollections: any, savedAllCollectionsStats:any) => {
        const numberOfCollectionsToRequest = 300;
        for (let index = 0; index < newCollections.length; index += numberOfCollectionsToRequest) {
            const newCollectionsDetailedData: any = await this._getNewCollectionsDetailedData(newCollections, index, numberOfCollectionsToRequest);
            if (newCollectionsDetailedData !== null) {
                this._saveNewCollections(newCollectionsDetailedData, newCollections, savedAllCollectionsStats);
            }
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

    private _saveNewCollections = async(newCollectionsDetailedData: any, newCollections: any, savedAllCollectionsStats: any) => {
        for (const collection of newCollectionsDetailedData) {
            if (collection !== null && collection !== undefined && collection.symbol) {
                const volumenAll: any = newCollections.find(newCollection => newCollection.symbol === collection.symbol)?.volumeAll;
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
                    Expired: volumenAll === undefined || volumenAll === null || volumenAll <= 100
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
            }
        }
    }
}

