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
// const {razorpay} = require('../../config/razorpay')
const Razorpay = require('razorpay');

const mongoose = require('mongoose');
require("dotenv").config()

const razorpay = new Razorpay({
    key_id: process.env.YOUR_RAZORPAY_TEST_KEY,
    key_secret: process.env.YOUR_RAZORPAY_TEST_SECRET
});



// to rener cart page
const cart = async (req,res)=>{

    const user = req.session.user._id;

        const pages = 5;
        const page = parseInt(req.query.page) || 1;

        if (!mongoose.Types.ObjectId.isValid(user)) {
            console.log('Invalid userId:', user);
            return res.status(400).send('Invalid user ID');
        }

        const cartItems = await CartSchema.find({ userId: user })
            .skip((page - 1) * pages)
            .limit(pages)
            .lean();  

        let cartTotal = 0;
        let filteredCartItems = [];

        for (const cartItem of cartItems) {
            let validItems = [];

            for (const item of cartItem.items) {
                const product = await productSchema.findOne({ _id: item.productId}).lean();

                if (product) {
                    validItems.push(item);  
                    cartTotal += item.quantity * item.price;  
                }
            }

            if (validItems.length > 0) {
                cartItem.items = validItems;
                filteredCartItems.push(cartItem);
            }
        }

        const totalItems = await CartSchema.countDocuments({ userId: user });
        const totalPages = Math.ceil(totalItems / pages);

        if(req.session.coupon){

         const coupon = await couponSchema.findOne({couponCode:req.session.coupon})
        cartTotal = cartTotal - coupon.discountAmount
            
         }

       const cart = await CartSchema.findOneAndUpdate({ userId: user },{totalPrice:cartTotal},{ new: true })
       
       if(cart){
        cartTotal = cart.totalPrice 
       }
       
       const cartCountItems = await CartSchema.findOne({userId:user})
  
       cartCount = cartCountItems ? cartCountItems.items.length : 0 

       const wishlist  = await wishlistSchema.findOne({userID:user})
       const wishlistCount = wishlist ? wishlist.items.length : 0 
 
        res.render('user/shopingCart', {
            user: req.session.user || null,
            cartItems: filteredCartItems,  
            cartTotal,
            currentPage: page,
            totalPages: totalPages,
            cartCount,
            wishlistCount
});

    
}

 

//add to cart
const addCart = async (req,res)=>{
    const { productId, name, price, quantity, imageUrl } = req.body;
    const user = req.session.user._id;
    
    console.log(productId, name, price, quantity, imageUrl);
    
    try {

        const product = await productSchema.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
    
        let cart = await CartSchema.findOne({ userId: user });
    
        if (!cart) {
            cart = new CartSchema({
                userId: user,
                items: []
            });
        }
    
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        let currentCartQuantity = 0;
    
        if (existingItemIndex > -1) {
            currentCartQuantity = cart.items[existingItemIndex].quantity;
        }
    
        const totalRequestedQuantity = currentCartQuantity + quantity;
    
        // Check if total quantity exceeds stock
        if (totalRequestedQuantity > product.stock) {
            return res.status(400).json({
                message: `Only ${product.stock} units are available in stock. You currently have ${currentCartQuantity} in your cart.`
            });
        }
    
        if (totalRequestedQuantity > 5) {
            return res.status(400).json({
                message: `You can only add up to 5 units of this product. You currently have ${totalRequestedQuantity} in your cart.`
            });
        }
    
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = totalRequestedQuantity;
        } else {
            cart.items.push({
                productId,
                productName: name,
                price,
                quantity,
                imageUrl
            });
        }
    
        await cart.save();

        const cartTotal = cart.items.length
        res.status(200).json({ message: 'Product added to cart successfully', cartTotal});
    
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
    
}



//check stock
const check_stock = async (req, res) => {
    try {
        const productId = req.params.id;
        const user = req.session.user
        const userId = user._id
        console.log(productId);
        
        
        
        const product = await productSchema.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cart = await CartSchema.findOne({ userId });
        let userQuantity = 0;
 
        if (cart) {
            const item = cart.items.find(item => item.productId.toString() === productId);
            if (item) {
                userQuantity = item.quantity; // Get current quantity in the user's cart
            }
        }

        if (product.stock <= 0) {
            return res.status(200).json({ inStock: false, userQuantity, availableStock: 0 });
        } else {
            return res.status(200).json({ inStock: true, userQuantity, availableStock: product.stock });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}



// remove from cart
 
const removeCart = async (req, res) => {
    const user = req.params.id;  // Extract user ID from route parameters
    const  itemId  = req.body.itemId;   
    // Extract item ID from request body
    console.log(itemId);
    
    if (!mongoose.Types.ObjectId.isValid(user) || !mongoose.Types.ObjectId.isValid(itemId)) {
        console.log(user);
        return res.status(400).send('Invalid user or item ID');
    }
    
    try {
        // Find the user's cart
        const cart = await CartSchema.findOne({ userId: user});
        console.log(cart);
        
        if (cart) {
            // Remove the item from the cart
            cart.items = cart.items.filter(item => item._id.toString() !== itemId);

            // Save the updated cart
            await cart.save();

            // Send success response
            res.status(200).json({ success: true, message: 'Item removed from cart' });
        } else {
            res.status(404).send('Cart not found');
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Internal Server Error');
    }

}


// increse and decrease cart items
const updateCart =  async (req, res) => {
    const userId = req.params.userId;
    const { itemId, quantity } = req.body;

    try {
        const cart = await CartSchema.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        let itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        
        if (itemIndex !== -1) {
            cart.items[itemIndex].quantity = quantity;

            cart.totalPrice = cart.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save(); 

            return res.json({ success: true, message: 'Item quantity updated', totalPrice: cart.totalPrice });
        } else {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


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




// order conformation

const conformationOrde = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const user = req.session.user._id
        const order = await orderSchema.findById(orderId).populate('items.productID'); 
    
        if (!order) {
            return res.status(404).send('Order not found');
        }
    
        const fullAddress = order.shippingAddress.address;
        const [location, city, state] = fullAddress.split(',').map(part => part.trim());
    
        const orderDetails = {
            orderId: order._id,
            status: order.orderStatus,
            product: order.items.map(item => item.productID.name).join(', '),
            quantity: order.items.map(item => item.quantity).join(', '),
            totalPrice: order.totalAmount,
            userId: {
                name: req.session.user.username,
                email: req.session.user.email,
            },
            shippingAddress: {
                location,  
                city,      
                state,     
                pincode: order.shippingAddress.pincode, 
                phone: order.shippingAddress.phone      
            },
            paymentMethod: order.paymentMethod,
            estimatedDelivery: '3-5 business days', 
        };
    
    
        const cartCountItems = await CartSchema.findOne({userId:user})
  
        cartCount = cartCountItems ? cartCountItems.items.length : 0 
 
        const wishlist  = await wishlistSchema.findOne({userID:user})
        const wishlistCount = wishlist ? wishlist.items.length : 0 

        res.render('user/orderConfirmation', {
            user: req.session.user,
            order: orderDetails,
            cartCount,
            wishlistCount
        });
    
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('An error occurred while fetching the order');
    }
    
    
}



// to apply coupon
const applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user._id;  
    
    try {
        const coupon = await couponSchema.findOne({ couponCode });
        
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code' });
        }
        
        if (new Date(coupon.endDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }
        
        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'Coupon already used ' });
        }

        
        const cart = await CartSchema.findOne({ userId });

        if (cart.totalPrice < coupon.minAmount) {
            return res.status(400).json({ message: `This coupon is available for purchases more than ${coupon.minAmount}` });
        }

        if (cart.totalPrice > coupon.maxAmount) {
            return res.status(400).json({ message: `This coupon is only applicable for purchases less than ${coupon.maxAmount}` });
        }

        let discount = 0;
        if (coupon.discountType === 'Fixed Amount') {
            discount = coupon.discountAmount;
        } else if (coupon.discountType === 'Percentage') {
            discount = (cart.totalPrice * coupon.discountAmount) /100;
        }

        // const total = cart.totalPrice - coupon.discountAmount;
        
        const newTotal = Math.max(cart.totalPrice - discount, 0);
        
        if(newTotal<100) return res.status(400).json({ message: `This coupon Can't Use Cart Min Amount is 100` });

        
        await CartSchema.findOneAndUpdate({ userId }, { totalPrice: newTotal }, { new: true });

        req.session.couponDiscound = coupon.discountAmount
        req.session.coupon = couponCode
        coupon.usedBy.push(userId);
        await coupon.save();
        
        res.status(200).json({ message: 'Coupon applied successfully', newTotal });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}


// to  remove coupon 
const removeCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user._id;  
    
    try {
        const coupon = await couponSchema.findOne({ couponCode });
        
        const cart = await CartSchema.findOne({ userId });


        const newTotal = cart.totalPrice + coupon.discountAmount;
        
        await CartSchema.findOneAndUpdate({ userId }, { totalPrice: newTotal }, { new: true });

        req.session.coupon = null
        req.session.couponDiscound = 0
        
        await couponSchema.findOneAndUpdate(
            {couponCode},
            { $pull : { usedBy : userId}},
            {new : true}
        )
        
        res.status(200).json({ message: 'Coupon removed successfully', newTotal });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}


// to show availabe coupons
const showCoupons = async (req,res)=>{

    try {

        const userId = req.session.user._id

        const coupon = await couponSchema.find({
            usedBy : { $nin : [userId] }
        })

         res.status(200).json(coupon)
        
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports={
    cart,
    addCart,
    check_stock,
    removeCart,
    updateCart,
    checkout,
    placeOrder,
    conformationOrde,
    applyCoupon,
    retryPayment,
    paymentSucess,
    handleRazorpayPayment,
    removeCoupon,
    showCoupons
}