const mongoose = require('mongoose');


const addressSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fullName: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    address: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    district:{
        type:String,
        require:true
    },
    pincode: { 
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        default: 'India' 
    },
    type :{
        type:String,
        require:true
    }
},{timestamps:true});

module.exports = mongoose.model('Address', addressSchema);
