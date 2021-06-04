const mongoose = require('mongoose');
const TransactionScheme = new mongoose.Schema({
    transactionType: {
        type: String,
        require: true
    },
    amount: {
        type: String,
        require: true
    },
    sender: {
        type: String,
    },
    debitAccount: String,
    creditAccount: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },

});

module.exports = mongoose.model('Transaction', TransactionScheme);