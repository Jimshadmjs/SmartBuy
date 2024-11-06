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


// deleete

// render order conformation

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




module.exports={
    cart,
    addCart,
    check_stock,
    removeCart,
    updateCart,
    conformationOrde,
}