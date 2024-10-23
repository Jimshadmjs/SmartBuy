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



// to render wishlist
const wishlist = async(req,res)=>{
    const userId = req.session.user._id;

    const user = await userSchema.findById(userId);
    if (!user) return res.redirect('/')

    const wishlist = await wishlistSchema.findOne({ userID: userId }).populate('items.productID') || { items: [] };
        const productIds = wishlist.items.map(item => item.productID._id);
        const offers = await offerSchema.find({ selectedProducts: { $in: productIds } });


        const offerMap = offers.reduce((map, offer) => {
            offer.selectedProducts.forEach(productId => {
                map[productId] = offer; 
            });
            return map;
        }, {});


        wishlist.items.forEach(item => {
            const productId = item.productID._id.toString();
            item.productID.offer = offerMap[productId] || null; 
            

            if (item.productID.offer) {
                const regularPrice = item.productID.price;
                const discountedPrice = Math.round(regularPrice - (regularPrice * (item.productID.offer.discountAmount / 100)));
                item.productID.bestOfferPrice = discountedPrice; 
            } else {
                item.productID.bestOfferPrice = item.productID.price; 
            }
        });

        res.render('user/wishlist',{
            user,
            wishlist
        })
}



// to add wish list
const addWishlist = async (req, res) => {
     
    const userId = req.session.user._id;
    const productId = req.params.productId;

    try {
        let wishlist = await wishlistSchema.findOne({ userID: userId });
        if (!wishlist) {
            wishlist = new wishlistSchema({ userID: userId, items: [] });
        }

        const exists = wishlist.items.some(item => item.productID.equals(productId));
        if (exists) {
            return res.status(400).json({ message: 'Item already in wishlist' });
        }

        wishlist.items.push({ productID: productId });
        await wishlist.save(); 

        res.status(200).json({ message: 'Item added to wishlist' });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}




// to remove from wishlist 
const removeFromWishlist = async (req, res) => {
    try {
        const { userID, productID } = req.body;

        // Find the user's wishlist and remove the item by productID
        const wishlist = await wishlistSchema.findOneAndUpdate(
            { userID },
            { $pull: { items: { productID } } }, // Remove the item with matching productID
            { new: true } // Return the updated document
        );

        if (wishlist) {
            return res.status(200).json({ message: 'Item removed from wishlist.', wishlist });
        } else {
            return res.status(404).json({ message: 'Wishlist not found.' });
        }
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ message: 'An error occurred while removing the item.' });
    }
};



module.exports = {
    addWishlist,
    removeFromWishlist,
    wishlist
}