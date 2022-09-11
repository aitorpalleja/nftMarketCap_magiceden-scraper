//userController.js
const Scraper = require('../models/scraperModel');
const collectionModel = require('../models/collectionsModel')
import { ScraperService } from '../services/scraperService';

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
    const startTime: number = Date.now() / 1000;
    const scraper = new ScraperService();
    let newCollectionsToAdd: any = [];
    let newCollectionsSymbolsList: any = [];
    let allCollectionsLength: number = 0;
    const numberOfCollectionsToRequest = 30

    scraper.getAllCollectionsData().then(async (allCollectionsData) => {
        allCollectionsLength = allCollectionsData[1]['collections']?.length; 
        const savedAllCollections = await collectionModel.find();
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
                    })
                    
                    await newCollection.save();
                }
            }
        }

        const result = {
            TIME: (Date.now() / 1000 - startTime).toFixed(2) + " segundos",
            NewCollectionsLength: newCollectionsToAdd.length,
            allCollectionsLength: allCollectionsLength
          };
        res.status(200).send({allCollections: result});
    }).catch((err) => {
        console.log("   eRROR, ", err)
    });
}