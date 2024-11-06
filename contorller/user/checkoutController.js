const userSchema = require("../../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../../models/productModel')
const categorySchema = require('../../models/category')
const addressSchema = require('../../models/addressModel')
const orderSchema = require('../../models/orderModel')
const CartSchema = require('../../models/cartModel')
const offerSchema = require('../../models/offerModel')
const couponSchema = require('../../models/couponModel')
const wishlistSchema = require('../../models/wishlistModel')
const Razorpay = require('razorpay');

const mongoose = require('mongoose');
require("dotenv").config()

const razorpay = new Razorpay({
    key_id: process.env.YOUR_RAZORPAY_TEST_KEY,
    key_secret: process.env.YOUR_RAZORPAY_TEST_SECRET
});


// checkout page rander
const checkout = async (req, res) => {
    const userId = req.params.id;

    const addresses = await addressSchema.find({ user: userId });

    const cart = await CartSchema.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        return res.render('user/checkout', {
            user: req.session.user,
            addresses,
            cartItems: [],
            cartSubtotal: 0,
            discount: 0,
            deliveryFee: 50,
            total: 0
        });
    }

    let cartSubtotal = 0;
    let discount = 0; 
    const deliveryFee = 50; 
    const populatedCartItems = [];

    for (const item of cart.items) {
        const product = item.productId;

        const productOffers = await offerSchema.find({
            isActive: true,
            targetType: 'Product',
            selectedProducts: product._id
        });

        const categoryOffers = await offerSchema.find({
            isActive: true,
            targetType: 'Category',
            selectedCategory: product.categoryID
        });

        const regularPrice = product.price;
        let bestOfferPrice = regularPrice;

        if (productOffers.length > 0) {
            const productDiscountedPrice = Math.round(regularPrice - (regularPrice * (productOffers[0].discountAmount / 100)));
            bestOfferPrice = Math.min(bestOfferPrice, productDiscountedPrice);
        }

        if (categoryOffers.length > 0) {
            const categoryDiscountedPrice = Math.round(regularPrice - (regularPrice * (categoryOffers[0].discountAmount / 100)));
            bestOfferPrice = Math.min(bestOfferPrice, categoryDiscountedPrice);
        }

        const totalPriceForItem = item.quantity * bestOfferPrice;
        cartSubtotal += totalPriceForItem;

        populatedCartItems.push({
            productName: product.name,
            price: bestOfferPrice, 
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            totalPrice: totalPriceForItem
        });
    }

    const totalPriceFromSchema = cart.totalPrice;
    
    let coupon = req.session.coupon

    let total = totalPriceFromSchema - discount + deliveryFee;

    cartCount = cart ? cart.items.length : 0

    const wishlist  = await wishlistSchema.findOne({userID:userId})
    const wishlistCount = wishlist ? wishlist.items.length : 0 

    if(req.session.couponDiscound){
        discount = `${req.session.couponDiscound}`
    }else{
        discount = 0
    }

    res.render('user/checkout', {
        user: req.session.user,
        addresses,
        cartItems: populatedCartItems,
        cartSubtotal,
        discount,
        deliveryFee,
        total,
        totalPriceFromSchema,
        coupon,
        cartCount,
        wishlistCount
    });
};




// to place the order
const placeOrder =  async (req, res) => {
    try {
        const userId = req.params.id;
        const { selectedAddress, fullName, address, pincode, phone, paymentMethod } = req.body;

        if(req.session.coupon){
            req.session.coupon = null
        }

        const cart = await CartSchema.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) return res.status(400).send('Your cart is empty');


        const outOfStockProducts = [];
        const orderItems = [];
        const originalPrices = [];  

        // Check product stock
        for (const item of cart.items) {
            const product = item.productId;
            if(!product.isListed) return res.status(400).json({message:`${product.name} is currently unavailable`})
            if (product.stock < item.quantity) {
                outOfStockProducts.push(product.name);
            } else {
                originalPrices.push( product.price * item.quantity );
                console.log(product.price);
                
                product.stock -= item.quantity;
                await product.save();
                orderItems.push({ productID: product._id, quantity: item.quantity, price: item.price });
            }
        }

        if (outOfStockProducts.length > 0) {
            return res.status(400).json({ message: `The following products are out of stock: ${outOfStockProducts.join(', ')}` });
        }

        const totalAmount = cart.totalPrice + 50;
        console.log(originalPrices);
        
        let sum = originalPrices.reduce((a,c)=> a+c,0)

         sum -= cart.totalPrice
         
         if(paymentMethod == 'cashOnDelivery' && totalAmount>1000) return res.status(400).json({message:`Above 1000 can't use cash on delivery ! `})
        
        // Create a new order
        const newOrder = new orderSchema({
            userID: userId,
            items: orderItems,
            totalAmount: totalAmount,
            shippingAddress: {
                fullname: selectedAddress ? fullName : req.body.fullName,
                address: selectedAddress ? address : req.body.address,
                pincode: selectedAddress ? pincode : req.body.pincode,
                phone: selectedAddress ? phone : req.body.phone
            },
            paymentMethod: paymentMethod === 'bankTransfer' ? 'UPI' : 'COD',
            orderStatus: 'Pending',
            offerDiscount: sum,  
            paymentStatus: paymentMethod === 'bankTransfer' ? 'Failed' : 'Pending'
        });

        if(req.session.couponDiscound){
            newOrder.couponDiscount = req.session.couponDiscound
            newOrder.offerDiscount -= req.session.couponDiscound
            req.session.couponDiscound = 0
        }

        // Handle payment methods
        if (paymentMethod === 'bankTransfer') {
            
            try {
                const razorpayOrder = await razorpay.orders.create({
                    amount: totalAmount * 100, 
                    currency: 'INR',
                    receipt: `receipt_${newOrder._id}`
                });

                newOrder.razorpayOrderId = razorpayOrder.id; 
                await newOrder.save();
                await CartSchema.findOneAndDelete({ userId: userId });

                // Send the Razorpay order ID to the frontend
                res.json({ orderId: newOrder._id, razorpayOrderId: razorpayOrder.id, totalAmount });

            } catch (error) {
                newOrder.paymentStatus = 'Failed'; 
                await newOrder.save();
                await CartSchema.findOneAndDelete({ userId: userId });
                res.status(500).json({ message: 'Payment failed. Please try again.', orderId: newOrder._id });
            }
        } else {

            await newOrder.save();
            await CartSchema.findOneAndDelete({ userId: userId }); 
            res.json({ orderId: newOrder._id });
        }

    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).send('An error occurred while processing your order');
    }
}



//to controll rozarpay


// Function to handle Razorpay payment if failure
const handleRazorpayPayment = async (req, res) => {
    try {
        
        const { id } = req.params;
        const {orderId}=req.body
        
        const order = await orderSchema.findOne({ razorpayOrderId: orderId });
        
        if (order) {
            order.paymentStatus = 'Failed';
            console.log( order.paymentStatus);
            
            order.razorpayPaymentId = req.body.paymentId; // Handle the failure payload

            await order.save();
            return res.status(200).json({ message: 'Payment failure handled successfully.' });
        }

        
    } catch (error) {
        console.error('Error handling Razorpay payment failure:', error);
        res.status(500).json({ message: 'Server error.' });
    }
}
  
// razorpay success
const paymentSucess =async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentId } = req.body;

        // Find the order and update the payment status to 'Success'
        await orderSchema.findByIdAndUpdate(orderId, { paymentStatus: 'Success' });

        res.status(200).json({ message: 'Payment successful', paymentId });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).send('Error updating payment status');
    }
}


// razorpay retrypeyment
const retryPayment=async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(orderId);
        
        
        // Find the order by orderId
        const order = await orderSchema.findById(orderId);
        console.log(order);
        console.log(order.paymentStatus);
        

        if ( order.paymentStatus === 'Success') {
            return res.status(400).json({ message: 'Cannot retry payment for this order.' });
        }

        // Send the razorpayOrderId to the frontend for retry
        res.json({
            razorpayOrderId: order.razorpayOrderId,
            totalAmount: order.totalAmount,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error processing retry payment:', error);
        res.status(500).json({ message: 'Server error while retrying payment.' });
    }
}

module.exports={
    checkout,
    placeOrder,
    retryPayment,
    paymentSucess,
    handleRazorpayPayment,
}