const mongoose = require('mongoose');
const { Schema } = mongoose;

const CouponSchema = new Schema({
    couponCode: { type: String, required: true },
    discountType: { type: String, required: true, enum: ['Percentage', 'Fixed Amount'] },
    discountAmount: { type: Number, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, required: true, default: 1 }, 
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);
