import mongoose from 'mongoose'

const topCollectionsStatsModel = new mongoose.Schema({
    Symbol: {
        type: String,
        length: 100,
        required: true
    },
    Name: {
        type: String,
        length: 100,
        required: false
    },
    Image: {
        type: String,
        length: 2000,
        required: false
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
    },
    WindowTime: {
        type: String,
        length: 3,
        required: false
    },
}, { collection: 'TopCollectionsStats' });

module.exports = mongoose.model('TopCollectionsStats', topCollectionsStatsModel);