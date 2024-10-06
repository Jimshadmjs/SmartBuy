const userSchema = require("../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../models/productModel')
const categorySchema = require('../models/category')
const addressSchema = require('../models/addressModel')
const orderSchema = require('../models/orderModel')
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

    const excludedCategories = await categorySchema.find({ isListed: true }).select('_id')

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

         res.render('user/product_detail',{user:true,product,relatedProducts})

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

const excludedCategories = await categorySchema.find({ isListed: true }).select('_id');

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
        user: null,
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
        const orders = await orderSchema.find({ userID: userId });

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
    updateDetails
}