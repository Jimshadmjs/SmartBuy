const adminModel = require("../../models/adminModel")
const userSchema = require('../../models/userModel')
const categorySchema = require('../../models/category')
const productSchema = require('../../models/productModel')
const orderSchema = require('../../models/orderModel')
const offerSchama = require('../../models/offerModel')
const couponSchema = require('../../models/couponModel')
const multer = require('multer');
const bcrypt = require('bcrypt')

// to render coupon management 
const coupon = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const skip = (currentPage - 1) * limit;

    try {
        const coupons = await couponSchema.find().sort({createdAt:-1}).skip(skip).limit(limit);
        const totalCoupons = await couponSchema.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('admin/coupons', {
            coupons,
            currentPage,
            totalPages
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}


// to add coupon
const addCoupon = async (req,res)=>{
    const { couponCode, discountType, discountAmount, minAmount, maxAmount, startDate, endDate } = req.body;
    try {
        const newCoupon = new couponSchema({
            couponCode,
            discountType,
            discountAmount,
            minAmount,
            maxAmount,
            startDate,
            endDate
        })

        await newCoupon.save()
        res.status(200).json({message:"coupon added successfully",coupon:newCoupon})
        
    } catch (error) {
        res.status(400).json({ message: 'Error adding coupon', error });
    }
}


// to edit coupon
const editCoupon = async (req,res)=>{
    const { couponId, couponCode, discountType, discountAmount, minAmount, maxAmount, startDate, endDate } = req.body;

    try {

        const updatedCoupon = await couponSchema.findByIdAndUpdate(couponId,{
            couponCode,
            discountType,
            discountAmount,
            minAmount,
            maxAmount,
            startDate,
            endDate
        })
        

        if(!updatedCoupon){
            res.status(404).json({message:"coupon not found"})
        }

        res.status(200).json({message:"coupon updated successfully",coupon:updatedCoupon})
    } catch (error) {
        
        res.status(500).json({ message: 'Error updating coupon' });
    }

}


// to delete coupon
const deleteCoupon = async (req,res)=>{
    const couponId = req.params.couponId
    
    try {
        
        const coupon = await couponSchema.findByIdAndDelete(couponId)

        if(!coupon){
            res.status(404).json({message:"coupon not found"})
        }

        res.status(200).json({message:"coupon deleted successfully"})
        
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon' });
    }
}



module.exports={
    coupon,
    addCoupon,
    editCoupon,
    deleteCoupon
}