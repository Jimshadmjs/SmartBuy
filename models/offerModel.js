const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    discountAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    targetType: { type: String, enum: ['Product', 'Category'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: false, refPath: 'targetType' }, 
    selectedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    selectedCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    
    
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

