const mongoose = require('mongoose');
const AccountScheme = new mongoose.Schema({
    accountName: {
        type: String,
        require: true
    },
    accountNumber: {
        type: String,
        require: true
    },
    balance: {
        type: Number,
        default: 0
    },
    userId: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model('Account', AccountScheme);