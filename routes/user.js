const express = require('express');
const router = express.Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');
const Account = require('../model/Account');
const Transactions = require('../model/Transactions');


router.get('/login', (req, res) => {
    res.render('login');
})

router.get('/transactions', ensureAuthenticated, async (req, res) => {
    const transactions = await Transactions.find({ creditAccount: req.user.phone, debitAccount: req.user.phone })
    console.log(transactions);
    res.render('transactions', { transactions });
})


router.get('/signup', (req, res) => {
    res.render('signup');
})
router.post('/signup', (req, res) => {
    const { name, email, password, password2, phone, dob } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2 || !phone || !dob) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('signup', {
            errors,
            name,
            email,
            password,
            password2,
            phone,
            dob
        });

    } else {
        User.findOne({ email: email }).then(user => {
            if (user) {
                //user exist 
                errors.push({ msg: 'Email already registered' });
                res.render('signup', {
                    errors,
                    name,
                    email,
                    password,
                    password2,
                    phone,
                    dob
                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password,
                    phone,
                    dob
                });
                const account = new Account({
                    accountNumber: phone,
                    accountName: name,
                    userId: newUser._id
                });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save().then(result => {
                            account.save().then(data => {
                                console.log(data);
                                req.flash('success_msg', 'User added Successfully');
                                res.redirect('/signup');
                            }).catch(error => console.log(error));

                        }).catch(err => {

                        })

                    })
                })

            }
        }).catch(err => {

        });
    }
});
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    const { balance } = await Account.findOne({ userId: req.user._id });
    res.render('dashboard', { name: req.user.name, balance });
})
router.get('/deposit', ensureAuthenticated, (req, res) => {
    res.render('deposit', { name: req.user.name });
})

router.get('/send', ensureAuthenticated, (req, res) => {
    res.render('send', { name: req.user.name });
})

router.post('/send', ensureAuthenticated, (req, res) => {
    let errors = [];
    const { amount, accountNumber } = req.body;
    if (!amount || amount <= 0) {
        errors.push({ msg: 'Please enter valid deposit Amount' });
        return res.render('send', {
            errors,
            amount,
            accountNumber
        });
    } else if (!accountNumber) {
        errors.push({ msg: 'Please enter Account Number' });
        return res.render('send', {
            errors,
            amount,
            accountNumber
        });
    }
    getAccount(accountNumber).then(acc => {
        if (!acc) {
            console.log(acc);
            errors.push({ msg: 'Invalid Account Number' });
            return res.render('send', {
                errors,
                amount,
                accountNumber
            });
        }
    }).catch(error => {
        console.log(error);
    })



    //find and check sender account balance
    Account.findOne({ userId: req.user._id }).then(account => {
        if (!account) {
            errors.push({ msg: 'No Account Found' });
            return res.render('send', {
                errors,
                amount,
                accountNumber
            });
        }

        if (account.balance < Number(amount)) {
            errors.push({ msg: 'Insufficient Fund' });
            return res.render('send', {
                errors,
                amount,
                accountNumber
            });
        }
    })

    Account.findOne({ userId: req.user._id }).then(senderAccount => {
        if (debitAccount(senderAccount.accountNumber, amount)) {
            if (creditAccount(accountNumber, amount)) {
                //sender, transactionType, debitAccount, creditAccount, amount
                if (updateTransaction(req.user.name, "Transfer",
                    senderAccount.accountNumber,
                    accountNumber,
                    amount)) {
                    req.flash('success_msg', 'Sent Successfully');
                    res.redirect('/send');
                }
            }
        }

    })
})


router.post('/deposit', ensureAuthenticated, (req, res) => {
    let errors = []
    const { amount } = req.body;
    if (!amount || amount == 0) {
        errors.push({ msg: 'Please enter valid deposit Amount' });
        res.render('deposit', {
            errors,
            amount,

        });
    }
    const transaction = new Transactions({
        transactionType: "deposit",
        amount,
        sender: "self",
        creditAccount: req.user.phone
    })
    console.log(transaction);
    Account.findOne({ userId: req.user._id }).then(account => {
        account.balance += Number(amount);
        account.save().then(data => {
            transaction.save().then(trans => {
                console.log(trans);
                req.flash('success_msg', 'Account Credited Successfully');
                res.redirect('/deposit');
            }).catch(error => {
                console.log(error);
            })

        })
    }).catch(error => {
        console.log(error);
        req.flash('error_msg', 'Unable to deposit, try again');
        res.redirect('/deposit');
    });
})
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
});

const debitAccount = async (accountNumber, amount) => {
    const account = await Account.findOne({ accountNumber });
    console.log("debit account", account);
    account.balance -= Number(amount);
    const result = await account.save();
    return result;
}
const getUserAccount = async (user) => {
    const account = await Account.findOne({ userId: user._id });
    return account.accountNumber;

}

const creditAccount = async (accountNumber, amount) => {
    const account = await Account.findOne({ accountNumber });
    account.balance += Number(amount);
    const result = await account.save();
    return result;
}
const getAccount = (accountNumber) => {
    const account = Account.findOne({ accountNumber });
    return account;
}

const updateTransaction = async (sender, transactionType, debitAccount, creditAccount, amount) => {
    const transaction = new Transactions({
        sender,
        transactionType,
        debitAccount,
        creditAccount,
        amount: Number(amount),
    });
    const trans = await transaction.save();
    return trans;

}



module.exports = router;