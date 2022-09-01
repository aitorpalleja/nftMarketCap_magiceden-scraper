//userController.js
const Scraper = require('../models/scraperModel');
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

exports.getAllCollections = (req: any, res: any) => {
    console.log("aqui estoy");
    const scraper = new ScraperService();
    scraper.getAllCollectionsData().then((response) => {
        res.status(200).send({allCollections: response});
    }).catch((err) => {

    });
}