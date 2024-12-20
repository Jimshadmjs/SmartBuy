const userSchema = require("../../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../../models/productModel')
const categorySchema = require('../../models/category')
const addressSchema = require('../../models/addressModel')
const orderSchema = require('../../models/orderModel')
const CartSchema = require('../../models/cartModel')
const offerSchema = require('../../models/offerModel')
const walletSchema = require('../../models/walletModel')
const wishlistSchema = require('../../models/wishlistModel')
const mongoose = require('mongoose');
require("dotenv").config()


// to render signup page
const register = (req,res)=>{
    req.session.referralCode = req.query.referralCode
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
        res.status(500).send("Internal server error");
        
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

        req.session.otp = otp; 
        res.redirect('/verifyOTP')
    } catch (error) {
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

            if(req.session.referralCode){
                const userId = req.session.referralCode
                newUser.referredBy = userId
                await walletSchema.findOneAndUpdate(
                    {userId},
                    {$inc : { balance : 200},
                $push : {
                    transactions : {
                        type: 'credit', 
                        amount : 200 ,
                        description: 'Refferal Bonus '
                    }
                }
                },
                { new: true, upsert: true } 
                )                 
            }
            
            newUser.save()
            req.session.user = newUser
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
const home = async (req, res) => {
  const excludedCategories = await categorySchema.find({ isListed: false }).select('_id');

  const products = await productSchema.find({
      isListed: true,
      categoryID: { $nin: excludedCategories.map(cat => cat._id) }
  }).limit(12).populate({ path: 'categoryID', select: 'name' });

  const productOffers = await offerSchema.find({
      isActive: true,
      targetType: 'Product',
      selectedProducts: { $in: products.map(p => p._id) }
  }).populate('selectedProducts');

  const categoryIDs = products.map(p => p.categoryID); 

const categoryOffers = await offerSchema.find({
    isActive: true,
    targetType: 'Category',
    selectedCategory: { $in: categoryIDs }
}).populate('selectedCategory');


  const formattedProducts = products.map(product => {
      const productOffer = productOffers.find(offer => 
          offer.selectedProducts.some(selectedId => selectedId.equals(product._id))
      );

      const categoryOffer = categoryOffers.find(offer => 
          offer.selectedCategory.some(selectedCat => selectedCat.equals(product.categoryID))
      );

      const originalPrice = product.price;
      let discountedPrice = originalPrice; 

      if (productOffer) {
          discountedPrice = Math.round(originalPrice - (originalPrice * (productOffer.discountAmount / 100)));
      } else if (categoryOffer) {
          discountedPrice = Math.round(originalPrice - (originalPrice * (categoryOffer.discountAmount / 100)));
      }

      return {
          _id: product._id,
          name: product.name,
          price: originalPrice,
          description: product.description,
          images: product.images,
          stock: product.stock,
          colors: product.colors,
          rating: product.rating,
          category: product.categoryID ? product.categoryID.name : 'Unknown',
          offer: discountedPrice < originalPrice ? {
              discountedPrice,
              hasOffer: true
          } : { hasOffer: false }
      };
  });

  const categories = await categorySchema.find();
  
  const cart = await CartSchema.findOne({userId:req.session.user})
  
  cartCount = cart ? cart.items.length : 0

  const wishlist  = await wishlistSchema.findOne({userID:req.session.user})
  const wishlistCount = wishlist ? wishlist.items.length : 0  

  if (req.session.user) {
      res.render('user/home', { user: req.session.user, categories, products: formattedProducts ,cartCount,wishlistCount});
  } else {
      res.render('user/home', { user: false, categories, products: formattedProducts });
  }
}



// product detail page
const product_details = async (req, res) => {
  try {
      const id = req.params.id;

      const product = await productSchema.findById(id);
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      const relatedProducts = await productSchema.find({
          categoryID: product.categoryID,
          _id: { $ne: product._id },
          isListed: true
      }).limit(8);

      const productOffers = await offerSchema.find({
          isActive: true,
          targetType: 'Product',
          selectedProducts: product._id
      });

      const categoryIDs = [product.categoryID]; 

      const categoryOffers = await offerSchema.find({
          isActive: true,
          targetType: 'Category',
          selectedCategory: { $in: categoryIDs }
      }).populate('selectedCategory'); 


      const productOffer = productOffers.length > 0 ? productOffers[0] : null;
      const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

      const formattedProduct = {
          _id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          images: product.images,
          stock: product.stock,
          colors: product.colors,
          createdAt: product.createdAt,
          rating: product.rating,
          isListed:product.isListed,
          category: product.categoryID ? product.categoryID.name : 'Unknown',
          offer: productOffer ? {
              discountedPrice: Math.round(product.price - (product.price * (productOffer.discountAmount / 100))),
              hasOffer: true
          } : { hasOffer: false }
      };

      if (categoryOffer) {
          const categoryDiscountedPrice = Math.round(product.price - (product.price * (categoryOffer.discountAmount / 100)));
          formattedProduct.categoryOffer = {
              discountedPrice: categoryDiscountedPrice,
              hasOffer: true
          };
      }

      const cart = await CartSchema.findOne({userId:req.session.user})
  
      cartCount = cart ? cart.items.length : 0

      const wishlist  = await wishlistSchema.findOne({userID:req.session.user})
      const wishlistCount = wishlist ? wishlist.items.length : 0 

      res.render('user/product_detail', {
          user: req.session.user ?? false,
          product: formattedProduct,
          relatedProducts,
          cartCount,
          wishlistCount
      });

  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
};




// to give rating
const rating = async (req, res) => {
    
    const { rating } = req.body;
    const productId = req.params.productId;

    try {
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Calculate new average rating
        const totalRating = product.rating * product.ratingCount + rating;
        const newRatingCount = product.ratingCount + 1;
        const newAverageRating = totalRating / newRatingCount;

        // Update the product with the new values
        const updatedProduct = await productSchema.findOneAndUpdate(
            { _id: productId },
            {
                $set: {
                    rating: newAverageRating,
                },
                $inc: {
                    ratingCount: 1
                }
            },
            { new: true } // Return the updated document
        );
        res.status(200).json({ message: 'Rating submitted successfully', product });
    } catch (error) {
        res.status(500).send('Internal Server Error');
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

const shop = async (req, res) => {
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

  // Fetch product offers
  const productOffers = await offerSchema.find({
      isActive: true,
      targetType: 'Product',
      selectedProducts: { $in: products.map(p => p._id) }
  }).populate('selectedProducts');

  // Fetch category offers
  const categoryIds = products.map(product => product.categoryID);

  const categoryOffers = await offerSchema.find({
      isActive: true,
      targetType: 'Category',
      selectedCategory: { $in: categoryIds }
  }).populate('selectedCategory');

  const formattedProducts = products.map(product => {
      const originalPrice = product.price;

      // Find the applicable product offer
      const productOffer = productOffers.find(offer => 
          offer.selectedProducts.some(selectedId => selectedId.equals(product._id))
      );

      // Calculate product offer discounted price
      const productDiscountedPrice = productOffer 
          ? Math.round(originalPrice - (originalPrice * (productOffer.discountAmount / 100))) 
          : null;

      // Find the applicable category offer
      const categoryOffer = categoryOffers.find(offer => 
          offer.selectedCategory.some(selectedId => selectedId.equals(product.categoryID))
      );

      // Calculate category offer discounted price
      const categoryDiscountedPrice = categoryOffer 
          ? Math.round(originalPrice - (originalPrice * (categoryOffer.discountAmount / 100))) 
          : null;

      // Determine the best offer
      let bestDiscountedPrice = null;
      let hasOffer = false;
      let bestOfferPercentage = 0

      if (productDiscountedPrice && categoryDiscountedPrice) {
          bestDiscountedPrice = Math.min(productDiscountedPrice, categoryDiscountedPrice);
          bestOfferPercentage = bestDiscountedPrice < originalPrice 
          ? Math.round(((originalPrice - bestDiscountedPrice) / originalPrice) * 100) 
          : 0;
      } else if (productDiscountedPrice) {
          bestDiscountedPrice = productDiscountedPrice;
          bestOfferPercentage = Math.round(((originalPrice - bestDiscountedPrice) / originalPrice) * 100);
      } else if (categoryDiscountedPrice) {
          bestDiscountedPrice = categoryDiscountedPrice;
          bestOfferPercentage = Math.round(((originalPrice - bestDiscountedPrice) / originalPrice) * 100);
      }

      if (bestDiscountedPrice) {
          hasOffer = true;
      }

      return {
          _id: product._id,
          name: product.name,
          price: originalPrice,
          description: product.description,
          images: product.images,
          stock: product.stock,
          colors: product.colors,
          createdAt: product.createdAt,
          rating: product.rating,
          category: product.categoryID ? product.categoryID.name : 'Unknown',
          offer: hasOffer ? {
              discountedPrice: bestDiscountedPrice,
              hasOffer: true,
              offerPercentage:bestOfferPercentage
          } : { hasOffer: false }
      };
  });

  const categories = await categorySchema.find();

  const cart = await CartSchema.findOne({userId:req.session.user})
  
  cartCount = cart ? cart.items.length : 0

  const wishlist  = await wishlistSchema.findOne({userID:req.session.user})
  const wishlistCount = wishlist ? wishlist.items.length : 0

  if (req.session.user) {
      res.render('user/productsPage', {
          user: req.session.user,
          categories,
          products: formattedProducts,
          currentPage: page,
          totalPages,
          cartCount,
          wishlistCount
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
  
  
      res.redirect("/forgetOtp");
    } catch (error) {

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

    if (parseInt(enteredOtp) === req.session.otp) {
  
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
        
      const user = await userSchema.findOne({ email });
      if (!user) {
        return res.redirect("/forgotmail?message=emai not exist");
      }
  
      const genotp = Math.floor(1000 + Math.random() * 9000);
  
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
  
  
      res.redirect("/forgetOtp");

    } catch (error) {

      res.send("Something went wrong");
    }
  };
  



// to update new password
  const newpassVerify = async (req, res) => {
    try {
  
      const { password } = req.body;
      const email = req.session.email;
  
      const existingUser = await userSchema.findOne({ email });
  
      if (!existingUser) {
        return res.render("user/newpass", { message: "Email does not exist" });
      }
  
      const hashPassword = await bcrypt.hash(password, 10);
  
      await userSchema.updateOne(
        { email: email }, 
        { $set: { password: hashPassword } } 
      );
  
      res.redirect('/login?message=Password changed successfully')
    } catch (error) {
      res.send("Something wentwrong");
    }
  };



// to reset password
const resetPassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    

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
    rating,
    logout,
    shop,
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