//userController.js
import { ScraperService } from '../services/scraperService';
const Scraper = require('../models/scraperModel');
const collectionModel = require('../models/collectionsModel');
const collectionsStatsModel = require('../models/collectionsStatsModel');

exports.getAllScrapers = (req: any, res: any) => {
    Scraper.find({}, (err: any, scraper: any) => {
        if(err) return res.status(500).send({message: `Error al realizar la petición: ${err}`});
        if(!scraper) return res.status(404).send({message: `No existen scraper`});
        res.status(200).send({users: scraper});
    });
};

exports.getScraperByName = (req: any, res: any) => {
    let userId = req.params.id;
    Scraper.findOne({_id: userId}, (err: any, user: any) => {
        if(err) return res.status(500).send({message: `Error al realizar la petición: ${err}`});
        if(!user) return res.status(404).send({message: `No existe ese user`});
        res.send({user: user});
    });
};

exports.scrapNftAndSaveData = (req: any, res: any) => {
    let symbol = req.params.nftSymbol;
    // Scrap
    const scraper = new ScraperService();
    scraper.getNftData(symbol).then((response) => {
        res.status(200).send({nftData: response});
    }).catch((err) => {

    });
    

    // Save
}

exports.getAllCollections = async (req: any, res: any) => {
    console.log("***START getAllCollections***");
    const startTime: number = Date.now() / 1000;
    const scraper = new ScraperService();
    let newCollectionsToAdd: any = [];
    let newCollectionsSymbolsList: any = [];
    let allCollectionsLength: number = 0;
    const numberOfCollectionsToRequest = 300;

    scraper.getAllCollectionsData().then(async (allCollectionsData) => {
        allCollectionsLength = allCollectionsData[1]['collections']?.length; 
        const savedAllCollections = await collectionModel.find();
        const savedAllCollectionsStats = await collectionsStatsModel.find();
        for (const collection of allCollectionsData[1]['collections']) {   
            if (collection !== null && collection !== undefined && collection.symbol) {
                const collectionFinded = savedAllCollections.find(savedCollection => savedCollection.Symbol === collection.symbol);
                if (collectionFinded === null || collectionFinded === undefined) {
                    newCollectionsToAdd.push(collection);
                }
            }          
        }

        for (let index = 0; index < newCollectionsToAdd.length; index += numberOfCollectionsToRequest) {
            const slicedCollectionArray = newCollectionsToAdd.slice(index, index + numberOfCollectionsToRequest);
            let newSymbolsText = "[" + slicedCollectionArray.map(collection => '"' + collection.symbol + '"') + "]";
            newSymbolsText = newSymbolsText.replace(/"/gi, "%22");
            newSymbolsText = newSymbolsText.replace(/ /gi, "%20");

            newCollectionsSymbolsList.push(newSymbolsText);
            const newCollectionsData = await scraper.getCollectionListData(newSymbolsText);
            for (const collection of newCollectionsData[1]) {
                if (collection !== null && collection !== undefined && collection.symbol) {
                    const volumenAll = newCollectionsToAdd.find(newCollection => newCollection.symbol === collection.symbol)?.volumeAll;
                    const newCollection = new collectionModel({
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
                    
                    const newCollectionStats = new collectionsStatsModel({
                        Symbol: collection.symbol,
                        FloorPrice: null,
                        ListetCount: null,
                        TotalSupply: null,
                        MarketCap: null,
                        VolumenAll: volumenAll !== undefined && volumenAll !== null ? volumenAll : null,
                        UniqueHolders: null
                    });

                    await newCollection.save();

                    const collectionStatsFinded = savedAllCollectionsStats.find(savedCollectionStats => savedCollectionStats.Symbol === newCollectionStats.Symbol);
                    if (collectionStatsFinded === null || collectionStatsFinded === undefined) {
                        await newCollectionStats.save();
                    } else {
                        await newCollectionStats.updateOne({'Symbol': newCollectionStats.Symbol},{$set:{'VolumenAll': newCollectionStats.VolumenAll}})
                    }
                   
                }
            }
        }

        const result = {
            TIME: (Date.now() / 1000 - startTime).toFixed(2) + " segundos",
            NewCollectionsLength: newCollectionsToAdd.length,
            allCollectionsLength: allCollectionsLength
          };
          console.log("***DONE getAllCollections***");
          console.log("TIME: ", result.TIME);
          console.log("NewCollectionsLength: ", result.NewCollectionsLength);
          console.log("allCollectionsLength: ", result.allCollectionsLength);
        res.status(200).send({allCollections: result});
    }).catch((err) => {
        console.log("   eRROR, ", err)
    });
}

exports.getAllCollectionsUniqueHolders = async (req: any, res: any) => {
    try {
        console.log("***START getAllCollectionsUniqueHolders***");
        const startTime: number = Date.now() / 1000;
        const scraper = new ScraperService();
        // const savedAllCollections = await collectionModel.find({Expired: false});
        const savedAllCollections = await collectionsStatsModel.find( { VolumenAll: { $gt: 100 } } )
        let collectionsUpdated = 0;
        let symbolsList: string = '';
        let symbolsCount: number = 0;
        for (const collection of savedAllCollections) {
            symbolsCount++;
            symbolsList = symbolsList === '' ? collection.Symbol : symbolsList + ',' + collection.Symbol;
            if (symbolsCount >= 2) {
                const collectionsData = await scraper.getCollectionsHoldersData(symbolsList);
                for (const collectionData of collectionsData) {
                    if (collectionData !== undefined && collectionData !== null && collectionData[1]?.results !== undefined) {
                        const totalSupply = collectionData[1].results.totalSupply !== null && collectionData[1].results.totalSupply !== undefined ? collectionData[1].results.totalSupply : null;
                        const uniqueHolders = collectionData[1].results.uniqueHolders !== null && collectionData[1].results.uniqueHolders !== undefined ? collectionData[1].results.uniqueHolders : null;
                        await collectionsStatsModel.updateOne({'Symbol': collectionData[1].results.symbol},{$set:{'TotalSupply': totalSupply, 'UniqueHolders': uniqueHolders }});
                        collectionsUpdated++;
                    }
                }
                symbolsList = '';
                symbolsCount = 0;
            }
        }

        const result = {
            TIME: (Date.now() / 1000 - startTime).toFixed(2) + " segundos",
            ActiveCollectionsLength: savedAllCollections.length,
            CollectionsUpdated: collectionsUpdated
          };
        console.log("***DONE getAllCollectionsUniqueHolders***");
        console.log("TIME: ", result.TIME);
        console.log("ActiveCollectionsLength", savedAllCollections.length);
        console.log("CollectionsUpdated: ", collectionsUpdated);
        res.status(200).send({result: result});
    } catch (error) {
        console.log("   eRROR, ", error)
    }
 }