const mongoose = require('mongoose');


// Order Schema
const orderSchema = new mongoose.Schema({
    userID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    items: [
        {
            productID: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product', 
                required: true 
            },
            quantity: { 
                type: Number, 
                required: true ,
                min:1
            },
            price: { 
                type: Number, 
                required: true 
            }
        }
    ],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    shippingAddress: { 
        fullname:{type:String,required:true},
        address:{type:String,required:true},
        pincode:{type:String,required:true},
        
        phone:{type:String,required:true}

    },
    orderStatus: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['COD', 'UPI'], 
        required: true 
    },
    orderDate: { 
        type: Date, 
        default: Date.now 
    }
},{timestamps:true});

module.exports = mongoose.model('Order', orderSchema);
