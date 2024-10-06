const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const user = require('../middleware/userAuth')
const userController = require("../contorller/userController")


router.get('/logout',userController.logout)

router.get('/',userController.home)
router.get('/register',user.isLogin,userController.register)
router.post('/register',userController.registered)

router.get('/verifyOTP',user.isLogin,userController.otp)
router.get('/reSend',user.isLogin,userController.reSend)
router.post('/verifyOTP',userController.registerUser)

router.get('/login',user.isLogin,user.isLogin,userController.loadLogin);
router.post('/login',userController.login)

router.get('/product_details/:id',userController.product_details)
router.get('/shope',userController.shop)


router.get('/profile/:id',userController.profile)
router.post('/addAddress/:id',userController.addAddress)
router.patch('/editAddress/:id',userController.editAddress)
router.delete('/daleteAddress/:id',userController.daleteAddress)
router.patch('/userDetails/:id',userController.updateDetails)






module.exports = router;
