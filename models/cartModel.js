const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId, 
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 
    },
    imageUrl: {
        type: String,
        required: true
    }
}); 

// Cart Schema
const CartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    items: [CartItemSchema], 
    totalPrice: {
        type: Number,
        default: 0
    }
},{timestamps : true});

module.exports = mongoose.model('Cart', CartSchema);
