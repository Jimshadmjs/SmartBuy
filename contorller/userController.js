const userSchema = require("../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../models/productModel')
const categorySchema = require('../models/category')
const addressSchema = require('../models/addressModel')
const orderSchema = require('../models/orderModel')
const CartSchema = require('../models/cartModel')
const mongoose = require('mongoose');
require("dotenv").config()


// to render signup page
const register = (req,res)=>{
    const message = req.query.message
    res.status(200).render('user/signup',{msg:message})
}


// to send OTP
const registered = async (req,res)=>{
    try {

        const email = req.body.email

        const user = await userSchema.findOne({email})

        if(user) return res.redirect('/register?message=User already exist')
        
        const otp = Math.floor(1000 + Math.random() * 9000);
    
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL, pass: process.env.GOOGLE_MAIL_PASS_KEY },
          });

          const mailOptions = {
            from: process.env.EMAIL,
            to: req.body.email,
            subject: 'Your OTP',
            text: `Your OTP is ${otp} it will expire in a minute`,
          };
          await transporter.sendMail(mailOptions);
          console.log(otp);
          
          req.session.email = req.body.email
          req.session.otp = otp;
          req.session.signupData = req.body;
          req.session.otpExpires = Date.now() + 1 * 60 * 1000
          res.redirect('/verifyOTP');
        
    } catch (error) {
        console.log("error");
        
    }

}



// to render otp page
const otp = (req,res)=>{

    const message = req.query.message
    res.status(200).render('user/otp',{msg:message})
}



//to resend otp
const reSend = async (req,res)=>{
    
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(400).send("Email not found in session.");
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.GOOGLE_MAIL_PASS_KEY
            }
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP',
            text: `Your OTP is ${otp}`
        };

        await transporter.sendMail(mailOptions);

        req.session.otp = otp; // Update the OTP in the session
        console.log("OTP resent successfully.");
        res.redirect('/verifyOTP')
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).send("Error resending OTP");
    }
}

// to register user (save)
const registerUser = async (req,res)=>{
    try {
        const {otp1,otp2,otp3,otp4} = req.body
        const userOtp = otp1+otp2+otp3+otp4
        
        const sessionOtp = req.session.otp

        if(userOtp === sessionOtp.toString()){
            const newUser = userSchema(req.session.signupData)
            
            newUser.save()
            req.session.user = true
            res.redirect('/')
        }else{
            res.redirect('/verifyOTP?message=Invalid OTP')
        }
        
    } catch (error) {
        
    }
}


// to render login page
const loadLogin = (req,res)=>{
    const message = req.query.message
    res.render("user/login",{msg:message})
}

//login
const login = async (req,res)=>{
    try {
        
        const {email,password} = req.body

        const user = await userSchema.findOne({email})

        if(!user) return res.redirect('/login?message=User not exist')

        if(user.isBlocked) return res.redirect('/login?message=The user is blocked')

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch) return res.redirect('/login?message=Wrong password')

        req.session.user = user

        res.redirect('/')
    } catch (error) {
        res.redirect('/login?message=Something went wrong')
    }
}



// render home
const home = async(req,res)=>{

    const excludedCategories = await categorySchema.find({ isListed: false }).select('_id')

    const products = await productSchema.find({isListed:true,categoryID: { $nin: excludedCategories.map(cat => cat._id) }}).limit(12).populate({path: 'categoryID',select: 'name'});
    
    const formattedProducts = products.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        images: product.images,
        stock: product.stock,
        colors: product.colors,
        category: product.categoryID ? product.categoryID.name : 'Unknown' 
    }));
    
    const  categories = await  categorySchema.find()

    if(req.session.user){
        res.render('user/home',{user:req.session.user,categories,products:formattedProducts,

        })
    }else{
        res.render('user/home',{user:false,categories,products:formattedProducts,

        })
    }


}


// product detail page
const product_details = async (req,res)=>{

    try {
        
    
    const id = req.params.id
    
    const product = await productSchema.findById(id)
    
    if (!product) {
        return res.status(404).send('Product not found');
      }

    const relatedProducts = await productSchema.find({
        categoryID: product.categoryID, 
        _id: { $ne: product._id },
        isListed:true
      }).limit(8); 


      if(req.session.user){

         res.render('user/product_detail',{user:req.session.user,product,relatedProducts})

      }else{

         res.render('user/product_detail',{user:false,product,relatedProducts})

      }
      

    }catch (error) {
        console.error(error);
        res.status(500).send('Server error');
      }
}


//logout
const logout = (req,res)=>{
    try {
        
        delete req.session.user
        res.redirect('/')

    } catch (error) {
      res.status(500).send("Server error");
        
    }
}


// to render shope page

const shop = async (req,res)=>{

    const page = parseInt(req.query.page) || 1; 
const limit = 12; 
const skip = (page - 1) * limit;

const excludedCategories = await categorySchema.find({ isListed: false }).select('_id');

const products = await productSchema
    .find({ isListed: true, categoryID: { $nin: excludedCategories.map(cat => cat._id) } })
    .skip(skip) 
    .limit(limit) 
    .populate({ path: 'categoryID', select: 'name' });

const totalProducts = await productSchema.countDocuments({ isListed: true, categoryID: { $nin: excludedCategories.map(cat => cat._id) } });
const totalPages = Math.ceil(totalProducts / limit);

const formattedProducts = products.map(product => ({
    _id: product._id,
    name: product.name,
    price: product.price,
    description: product.description,
    images: product.images,
    stock: product.stock,
    colors: product.colors,
    createdAt:product.createdAt,
    category: product.categoryID ? product.categoryID.name : 'Unknown'
}));

const categories = await categorySchema.find();

if (req.session.user) {
    res.render('user/productsPage', {
        user: req.session.user,
        categories,
        products: formattedProducts,
        currentPage: page,
        totalPages
    });
} else {
    res.render('user/productsPage', {
        user: false,
        categories,
        products: formattedProducts,
        currentPage: page,
        totalPages
    });
}


}


// to render profile
const profile = async (req,res)=>{

    try {
        
        const userId = req.params.id; 
        
        const user = await userSchema.findById(userId)
        
        if (!user) {
            return res.redirect('/');
        }
        const addresses = await addressSchema.find({ user: userId });
        const orders = await orderSchema.find({ userID: userId }).populate('items.productID');

        res.status(200).render('user/profile',{user,addresses,orders})
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }

}


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


// to rener cart page
const cart = async (req,res)=>{

    const user = req.params.id;

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
                const product = await productSchema.findOne({ _id: item.productId, isListed: true }).lean();

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

        res.render('user/shopingCart', {
            user: req.session.user || null,
            cartItems: filteredCartItems,  
            cartTotal,
            currentPage: page,
            totalPages: totalPages
});

    
}




//add to cart
const addCart = async (req,res)=>{
    const { productId, name, price, quantity, imageUrl } = req.body;
    const user = req.params.id;
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
    
        res.status(200).json({ message: 'Product added to cart successfully' });
    
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
            cart.items[itemIndex].quantity = quantity; // Update the quantity

            await cart.save(); 

            return res.json({ success: true, message: 'Item quantity updated' });
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

    const cartItems = await CartSchema.find({ userId }).populate('items.productId');
    
    if (!cartItems || cartItems.length === 0) {
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
    let discount = 0.3; 
    let deliveryFee = 50; 



    const populatedCartItems = cartItems.flatMap(cart => {
        return cart.items.map(item => {
            const product = item.productId; 

            const totalPriceForItem = item.quantity * product.price;
            cartSubtotal += totalPriceForItem; 

            return {
                productName: product.name, 
                price: product.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl, 
                totalPrice: totalPriceForItem
            };
        });
    });

    // Calculate total price (Subtotal - Discount + Delivery Fee)
    let total = cartSubtotal - discount + deliveryFee;

    console.log(populatedCartItems);


    res.render('user/checkout', {
        user: req.session.user,
        addresses, 
        cartItems: populatedCartItems,
        cartSubtotal, 
        discount, 
        deliveryFee, 
        total
    });

}


// to place the order
const placeOrder =  async (req, res) => {
    try {
        const userId = req.params.id;
        const { selectedAddress, fullName, address, pincode, phone, paymentMethod } = req.body;
        console.log(selectedAddress, fullName, address, pincode, phone, paymentMethod);
        
        const cart = await CartSchema.findOne({ userId }).populate('items.productId');
    
        if (!cart || cart.items.length === 0) {
            return res.status(400).send('Your cart is empty');
        }
    
        const outOfStockProducts = [];
        const orderItems = [];
    
    
        for (const item of cart.items) {
            const product = item.productId;
    
        
            if (product.stock < item.quantity) {
                outOfStockProducts.push(product.name);
            } else {
                
                product.stock -= item.quantity;
                await product.save(); 
    
                orderItems.push({
                    productID: product._id,
                    quantity: item.quantity,
                    price: item.price
                });
            }
        }
    
        // If any products are out of stock, return an error message
        if (outOfStockProducts.length > 0) {
            return res.status(400).json({
                message: `The following products are out of stock: ${outOfStockProducts.join(', ')}`
            });
        }

        
        const totalAmount = orderItems.reduce((total, item) => {
            return total + item.quantity * item.price;
        }, 0);
        console.log("hurr");
        
    
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
            orderStatus: 'Pending'
        });
    
        await newOrder.save();
    
        // Clear the user's cart after successful order
       const check = await CartSchema.findOneAndDelete({ userId: userId });

        console.log(check);
        
    
        // res.redirect(`/order/confirmation/${newOrder._id}`);
        res.json({ orderId: newOrder._id });
    
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).send('An error occurred while processing your order');
    }
    
}


// order conformation

const conformationOrde = async (req, res) => {
    try {
        const orderId = req.params.orderId;
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
    
        console.log(orderDetails);
    
        // Render the confirmation page
        res.render('user/orderConfirmation', {
            user: req.session.user,
            order: orderDetails,
        });
    
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('An error occurred while fetching the order');
    }
    
    
}


// to cancel order

const cancelOrder =  async (req, res) => {
    const { orderId } = req.params;

    try {
       
        const order = await orderSchema.findByIdAndUpdate(
            orderId,
            { orderStatus: 'Cancelled' },
            { new: true } 
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'An error occurred while cancelling the order' });
    }
}

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



// search 

const search = async (req, res) => {
    const query = req.query.query;

    try {
        const results = await productSchema.find({
            name: { $regex: query, $options: 'i' }
        });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



// sort filter  not using now meybe helpfull in futer
const filter =  async (req, res) => {
    const { sort } = req.query; 

    let products;
    try {
        switch (sort) {
            case 'newness':
                products = await productSchema.find().sort({ createdAt: -1 });
                break;
            default:
                products = await productSchema.find();
        }
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}




// forget password
const forgotmail = (req, res) => {

    const message = req.query.message;

    res.render("user/forgotmail", { msg: message });
  };
  
  

// to send otp 
  const forgotEmailVerify = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if the email is in database
      const user = await userSchema.findOne({ email });
      if (!user) {
        return res.redirect("/forgotmail?message=email not exist");
      }
  
      req.session.email = email;

      const genotp = Math.floor(1000 + Math.random() * 9000);

      console.log(genotp);
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL, 
          pass: process.env.GOOGLE_MAIL_PASS_KEY, 
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP for Signup",
        text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
      };
  
      await transporter.sendMail(mailOptions);
  
      // Store OTP and expiration time in session
      req.session.otp = genotp;
      req.session.signupdata = req.body;
      req.session.otpExpires = Date.now() + 1 * 60 * 1000; 
  
      console.log(req.session.otp); 
  
      res.redirect("/forgetOtp");
    } catch (error) {

      console.error(error);
      res.send("Something went wrong");
    }
  };
  



// to render otp page
  const forgotOtpRender = (req, res) => {

    const message = req.query.message;

    res.render("user/forgetOtp", { msg: message });

  };
  



// to render new pass page
  const forgotPassOtp = (req, res) => {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const enteredOtp = otp1 + otp2 + otp3 + otp4;
  
    if (!req.session.otp) {
      return res.redirect(
        "/forgetOtp?message=Session expired. Please request a new OTP."
      );
    }
  
    if (Date.now() > req.session.otpExpires) {
      return res.redirect(
        "/forgetOtp?message=OTP expired. Please request a new one."
      );
    }

    console.log("njan forgot pass");
  
    if (parseInt(enteredOtp) === req.session.otp) {
      console.log("OTP verified successfully");
  
      req.session.otp = null;
      req.session.otpExpires = null;
      res.render("user/newpass", { msg: null });
    } else {
      return res.redirect("/forgetOtp?message=Invalid OTP. Please try again.");
    }
  };
  



// to resend otp 
  const forgotResendOTP = async (req, res) => {
    try {
      const email  = req.session.email;
        console.log(email);
        
      const user = await userSchema.findOne({ email });
      if (!user) {
        return res.redirect("/forgotmail?message=emai not exist");
      }
  
      const genotp = Math.floor(1000 + Math.random() * 9000);
      console.log(genotp);
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL, 
          pass: process.env.GOOGLE_MAIL_PASS_KEY, 
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP for Signup",
        text: `Your OTP for signup is ${genotp}. It will expire in 10 minutes.`,
      };
  
      await transporter.sendMail(mailOptions);
  
      req.session.otp = genotp;
      req.session.signupdata = req.body;
      req.session.otpExpires = Date.now() + 1 * 60 * 1000; 
  
      console.log(req.session.otp); 
  
      res.redirect("/forgetOtp");

    } catch (error) {

      console.error(error);
      res.send("Something went wrong");
    }
  };
  



// to update new password
  const newpassVerify = async (req, res) => {
    try {
      console.log("hai");
  
      const { password } = req.body;
      const email = req.session.email;
      console.log(email, password);
  
      const existingUser = await userSchema.findOne({ email });
      console.log(existingUser);
  
      if (!existingUser) {
        return res.render("user/newpass", { message: "Email does not exist" });
      }
  
      const hashPassword = await bcrypt.hash(password, 10);
  
      await userSchema.updateOne(
        { email: email }, 
        { $set: { password: hashPassword } } 
      );
  
      console.log("Password updated successfully");
      res.redirect('/login?message=Password changed successfully')
    } catch (error) {
      console.log(error);
      res.send("Something wentwrong");
    }
  };



// to reset password
const resetPassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    console.log(email, currentPassword, newPassword);
    

    try {
        const user = await userSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await userSchema.updateOne(
            { email: email }, 
            { $set: { password: hashedPassword } } 
          );
        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};




module.exports = {
    loadLogin,
    register,
    registered,
    otp,
    reSend,
    registerUser,
    login,
    home,
    product_details,
    logout,
    shop,
    profile,
    addAddress,
    editAddress,
    daleteAddress,
    updateDetails,
    cart,
    addCart,
    check_stock,
    removeCart,
    updateCart,
    checkout,
    placeOrder,
    conformationOrde,
    cancelOrder,
    orderDetails,
    search,
    filter,


    forgotmail,
    forgotEmailVerify,
    forgotPassOtp,
    forgotOtpRender,
    forgotResendOTP,
    newpassVerify,
    resetPassword
}