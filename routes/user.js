const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const user = require('../middleware/userAuth')
const userController = require("../contorller/user/userController")
const profileController = require('../contorller/user/profileController')
const cartController = require('../contorller/user/cartController')
const wishlistController = require('../contorller/user/wishlistController')
const wallerController = require('../contorller/user/walletController')


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
router.post('/rate/:productId',userController.rating)
router.get('/shope',userController.shop)


router.get('/profile',user.checkSession,profileController.profile)
router.post('/addAddress/:id',profileController.addAddress)
router.patch('/editAddress/:id',profileController.editAddress)
router.delete('/daleteAddress/:id',profileController.daleteAddress)
router.patch('/userDetails/:id',profileController.updateDetails)



router.get('/cart/:id',user.checkSession,cartController.cart)
router.post('/cart/check-stock/:id',cartController.check_stock)
router.post('/cart/add/:id',cartController.addCart)
router.patch('/cart/remove/:id',cartController.removeCart)
router.patch('/cart/update/:userId',cartController.updateCart)


router.get('/checkout/:id',user.checkSession,cartController.checkout)
router.post('/checkout/submit/:id',cartController.placeOrder)
router.get('/order/confirmation/:orderId',cartController.conformationOrde)



router.post('/order/cancel/:orderId',profileController.cancelOrder)
router.post('/return-order/:orderId',profileController.returnOrder)
router.get('/order/details/:orderId',profileController.orderDetails)


// razorpay
router.post('/payment/failure/:id',cartController.handleRazorpayPayment)
router.post('/payment/success/:orderId',cartController.paymentSucess);
router.post('/retryPayment/:orderId', cartController.retryPayment)


// meybe helpfull in futer
router.get('/products',userController.filter)



// forget password
router.get('/forgotmail',userController.forgotmail)
router.post('/forgot-otp',userController.forgotEmailVerify)
router.post("/forgetverifyotp",userController.forgotPassOtp)
router.get("/forgetOtp",userController.forgotOtpRender)
router.get("/forgotresendotp",userController.forgotResendOTP)
router.post("/update-password",userController.newpassVerify)

//resetPassword
router.patch('/resetPassword/:userId',userController.resetPassword)


router.post('/cart/applyCoupon',cartController.applyCoupon)
router.post('/cart/removeCoupon',cartController.removeCoupon)
router.get('/show/coupons',cartController.showCoupons)

router.get('/wishlist',user.checkSession,wishlistController.wishlist)
router.post('/wishlist/add/:productId',wishlistController.addWishlist)
router.delete('/wishlist/remove',wishlistController.removeFromWishlist)


router.get('/wallet/transactions',wallerController.transaction)
router.post('/wallet/add-funds',wallerController.add_fund)

router.get('/invoice/:orderId',profileController.generateInvoice)

module.exports = router;
