const express = require('express');
const router = express.Router();
const adminController = require("../contorller/admin/adminController")
const admin = require('../middleware/adminAuth')
const offerController = require('../contorller/admin/offerController')
const couponController = require('../contorller/admin/couponController')
const salesCotroller = require('../contorller/admin/salesController')
const path = require('path');
const productImageUpload=require('../config/multer')
const offer = require('../models/offerModel')






router.get('/login',admin.isLogin,adminController.login);
router.post('/login',adminController.loggedIn)

router.get('/dashboard',admin.checkSession,adminController.dashboard)

router.get('/users',admin.checkSession,adminController.users)
router.patch('/users/:id',adminController.isBlock)

router.get('/category',admin.checkSession,adminController.category)
router.post('/category',adminController.addCategory)
router.patch('/category/:id',adminController.listCategory)
router.patch('/category/edit/:id',adminController.editCategory)

router.get('/product',admin.checkSession,adminController.products)
router.post('/add-product',productImageUpload.array("croppedImage[]",10),adminController.add_product)
router.get('/products/:id',adminController.edit_product)
router.patch('/products/:id', productImageUpload.array("images[]",10),adminController.change_file)
router.post('/products/:id',adminController.toggle_list)


router.get('/orders',adminController.order)
router.put('/orders/:orderId/status',adminController.changeStatus)
router.post('/orders/:orderId/approve-cancellation', adminController.approveCancellation)
router.get('/order/details/:orderId',adminController.orderDetails)


router.get('/logout',adminController.logout)


router.get('/offer',offerController.offer)
router.get('/products',offerController.products)
router.get('/categories',offerController.categories)
router.post('/offers/add',offerController.addOffer)
router.patch('/offers/edit',offerController.editOffer)
router.patch('/offers/activate',offerController.activate)
router.patch('/offers/deactivate',offerController.deactivate)

router.get('/coupons',couponController.coupon);
router.post('/coupons/add',couponController.addCoupon)
router.patch('/coupons/edit/:id',couponController.editCoupon)
router.delete('/coupons/delete/:couponId',couponController.deleteCoupon)

router.get('/sales-report',salesCotroller.salesReport)
router.post('/generateReport',salesCotroller.generate)
router.get('/sales-report/download/pdf',salesCotroller.pdf)
router.get('/sales-report/download/excel',salesCotroller.excelReport)


module.exports = router;


