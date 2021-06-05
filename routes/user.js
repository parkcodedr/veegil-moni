const express = require('express');
const router = express.Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');
const Account = require('../model/Account');

const {
    getLogin,
    index,
    dashboard,
    getSignup,
    getDepositMoney,
    getTransactions,
    signupUser,
    signinUser,
    getsendMoney,
    sendMoney,
    depositMoney,
    logout
} = require('../controller/userController');


router.get('/login', getLogin);
router.get('/', index);

router.get('/transactions', ensureAuthenticated, getTransactions)

router.get('/signup', getSignup);

router.post('/signup', signupUser);

router.post('/login', signinUser);

router.get('/dashboard', ensureAuthenticated, dashboard);

router.get('/send', ensureAuthenticated, getsendMoney)

router.post('/send', ensureAuthenticated, sendMoney)

router.get('/deposit', ensureAuthenticated, getDepositMoney);
router.post('/deposit', ensureAuthenticated, depositMoney);

router.get('/logout', logout);




module.exports = router;