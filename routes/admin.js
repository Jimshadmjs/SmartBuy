const express = require('express');
const router = express.Router();
const adminController = require("../contorller/adminController")
const admin = require('../middleware/adminAuth')
const path = require('path');
const productImageUpload=require('../config/multer')






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


router.get('/logout',adminController.logout)


module.exports = router;


