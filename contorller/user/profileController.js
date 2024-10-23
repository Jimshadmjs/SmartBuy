const userSchema = require("../../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../../models/productModel')
const categorySchema = require('../../models/category')
const addressSchema = require('../../models/addressModel')
const orderSchema = require('../../models/orderModel')
const CartSchema = require('../../models/cartModel')
const offerSchema = require('../../models/offerModel')
const wishlistSchema = require('../../models/wishlistModel')
const walletSchema = require('../../models/walletModel')
const mongoose = require('mongoose');
require("dotenv").config()




// to render profile
const profile = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const user = await userSchema.findById(userId);
        if (!user) return res.redirect('/');

        const addresses = await addressSchema.find({ user: userId });

        // Fetch the wallet details for the user
        const wallet = await walletSchema.findOne({userId }) || { 
                    balance: 0, 
                    transactions: [] 
                };

        const page = parseInt(req.query.page) || 1;
        const limit = 5; 
        const skip = (page - 1) * limit;

        const totalOrders = await orderSchema.countDocuments({ userID: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await orderSchema
            .find({ userID: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.productID');

        res.status(200).render('user/profile', { 
            user, 
            addresses, 
            orders, 
            currentPage: page, 
            totalPages,
            wallet
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }
};




// to add new address
const addAddress = async (req,res)=>{

    const { fullName, phone, address, district, city, state, pincode, country, type } = req.body;
    const user = req.params.id
    
    if (!user) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const newAddress = new addressSchema({
            user,
            fullName,
            phone,
            address,
            district,
            city,
            state,
            pincode,
            country,
            type
        });

        await newAddress.save();
        res.status(200).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
        res.status(400).json({ message: 'Error adding address', error: error.message });
    }
}


// edit address
const editAddress = async (req,res)=>{    

    const { fullName, phone, address, district, city, state, pincode, country, type } = req.body;
    const addressId = req.params.id;
    
    const existingAddress = await addressSchema.findById(addressId);
    console.log(existingAddress);
    
    if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found.' });
    }
    
    try {
        // Update address fields
        existingAddress.fullName = fullName;
        existingAddress.phone = phone;
        existingAddress.address = address;
        existingAddress.district = district;
        existingAddress.city = city;
        existingAddress.state = state;
        existingAddress.pincode = pincode;
        existingAddress.country = country;
        existingAddress.type = type;
    
        // Save the updated address
        const updatedAddress = await existingAddress.save();
        
        // Return the updated address
        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error); // Log the error for debugging
        res.status(500).json({ message: 'Error updating address', error: error.message });
    }
         
}


// to delete address
const daleteAddress = async (req,res)=>{

    const addressId = req.params.id;

    try {

        const deletedAddress = await addressSchema.findByIdAndDelete(addressId);
        
        if (!deletedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Error deleting address', error: error.message });
    }

}



// update user detials

const updateDetails = async (req,res)=>{

    const { username, email } = req.body;

    const user = req.params.id
    

        await userSchema.findByIdAndUpdate(user, { username, email }, { new: true })

        .then(updatedUser => {

            res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
        })

        .catch(error => {

            res.status(500).json({ error: 'Failed to update profile' });

        });

}



// to cancel order

const cancelOrder =  async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.cancellationRequested = true;
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ message: 'Cancellation request submitted successfully. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({ message: 'An error occurred while submitting the cancellation request.' });
    }
};




// to return order

const returnOrder =  async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ success:false });
        }

        order.cancellationRequested = true;
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ success:true });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({success:false });
    }
};







// order details

const orderDetails = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findById(orderId).populate('items.productID'); 

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            orderedDate: order.createdAt, 
            orderStatus: order.orderStatus,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'An error occurred while fetching the order details' });
    }
}





module.exports={
    profile,
    addAddress,
    editAddress,
    daleteAddress,
    updateDetails,
    cancelOrder,
    orderDetails,
    returnOrder
}