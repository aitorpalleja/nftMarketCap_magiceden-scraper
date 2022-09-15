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
                        this._getAndSaveNewCollectionsData(newCollections, savedAllCollectionsStats);
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
    
    public getAllCollectionsStatsData = () => {
        // try {
        //     console.log("***START getAllCollectionsUniqueHolders***");
        //     const startTime: number = Date.now() / 1000;
        //     const scraper = new PuppeteerService();
        //     // const savedAllCollections = await collectionModel.find({Expired: false});
        //     const savedAllCollections = await collectionsStatsModel.find( { VolumenAll: { $lt: 100 } } )
        //     let collectionsUpdated = 0;
        //     let symbolsList: string = '';
        //     let symbolsCount: number = 0;
        //     for (const collection of savedAllCollections) {
        //         symbolsCount++;
        //         symbolsList = symbolsList === '' ? collection.Symbol : symbolsList + ',' + collection.Symbol;
        //         if (symbolsCount >= 2) {
        //             const collectionsData = await scraper.getCollectionsHoldersData(symbolsList);
        //             for (const collectionData of collectionsData) {
        //                 if (collectionData !== undefined && collectionData !== null && collectionData[1]?.results !== undefined) {
        //                     const totalSupply = collectionData[1].results.totalSupply !== null && collectionData[1].results.totalSupply !== undefined ? collectionData[1].results.totalSupply : null;
        //                     const uniqueHolders = collectionData[1].results.uniqueHolders !== null && collectionData[1].results.uniqueHolders !== undefined ? collectionData[1].results.uniqueHolders : null;
        //                     await collectionsStatsModel.updateOne({'Symbol': collectionData[1].results.symbol},{$set:{'TotalSupply': totalSupply, 'UniqueHolders': uniqueHolders }});
        //                     collectionsUpdated++;
        //                     // console.log("colleciones actualizadas")
        //                 }
        //             }
        //             symbolsList = '';
        //             symbolsCount = 0;
        //         }
        //     }
    
        //     const result = {
        //         TIME: (Date.now() / 1000 - startTime).toFixed(2) + " segundos",
        //         ActiveCollectionsLength: savedAllCollections.length,
        //         CollectionsUpdated: collectionsUpdated
        //       };
        //     console.log("***DONE getAllCollectionsUniqueHolders***");
        //     console.log("TIME: ", result.TIME);
        //     console.log("ActiveCollectionsLength", savedAllCollections.length);
        //     console.log("CollectionsUpdated: ", collectionsUpdated);
        // } catch (error) {
        //     console.log("   eRROR, ", error)
        // }
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
                const collectionStatsFinded: any = savedAllCollectionsStats.find(savedCollectionStats => savedCollectionStats.Symbol === newCollectionStats.Symbol);

                if (collectionStatsFinded === null || collectionStatsFinded === undefined) {
                    await collectionsController.saveNewCollectionStats(newCollectionStats);
                } else {
                    await collectionsController.updateOneCollectionStatsVolumenAll(newCollectionStats);
                }
            }
        }
    }
}

