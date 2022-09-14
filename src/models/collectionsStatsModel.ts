// const mongoose = require("mongoose");
import mongoose from 'mongoose'

const collectionsStatsModel = new mongoose.Schema({
    Symbol: {
        type: String,
        length: 100,
        required: true
    },
    FloorPrice: {
        type: mongoose.Types.Decimal128,
        required: false
    },
    ListetCount: {
        type: mongoose.Types.Decimal128,
        required: false
    },
    TotalSupply: {
        type: mongoose.Types.Decimal128,
        required: false
    },
    MarketCap: {
        type: mongoose.Types.Decimal128,
        required: false
    },
    VolumenAll: {
        type: mongoose.Types.Decimal128,
        required: false
    },
    UniqueHolders: {
        type: mongoose.Types.Decimal128,
        required: false
    }
}, { collection: 'CollectionsStats' });

module.exports = mongoose.model('CollectionsStats', collectionsStatsModel);