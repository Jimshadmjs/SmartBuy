const mongoose = require('mongoose');

// Wishlist Item Schema
const WishlistItemSchema = new mongoose.Schema({
    productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true,
    }
});

// Wishlist Schema
const WishlistSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    items: [WishlistItemSchema], // Array of wishlist items
}, { timestamps: true }); // Add createdAt and updatedAt fields

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

module.exports = Wishlist;
