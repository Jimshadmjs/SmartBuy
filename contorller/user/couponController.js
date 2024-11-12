

const CartSchema = require('../../models/cartModel')
const couponSchema = require('../../models/couponModel')



// to apply coupon
const applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user._id;  
    
    try {
        const coupon = await couponSchema.findOne({ couponCode });
        
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code' });
        }
        
        if (new Date(coupon.endDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }
        
        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ message: 'Coupon already used ' });
        }

        
        const cart = await CartSchema.findOne({ userId });

        if (cart.totalPrice < coupon.minAmount) {
            return res.status(400).json({ message: `This coupon is available for purchases more than ${coupon.minAmount}` });
        }

        if (cart.totalPrice > coupon.maxAmount) {
            return res.status(400).json({ message: `This coupon is only applicable for purchases less than ${coupon.maxAmount}` });
        }

        let discount = 0;
        if (coupon.discountType === 'Fixed Amount') {
            discount = coupon.discountAmount;
        } else if (coupon.discountType === 'Percentage') {
            discount = (cart.totalPrice * coupon.discountAmount) /100;
        }

        // const total = cart.totalPrice - coupon.discountAmount;
        
        const newTotal = Math.max(cart.totalPrice - discount, 0);
        
        if(newTotal<100) return res.status(400).json({ message: `This coupon Can't Use Cart Min Amount is 100` });

        
        await CartSchema.findOneAndUpdate({ userId }, { totalPrice: newTotal }, { new: true });

        
        req.session.couponDiscound = discount
        req.session.coupon = couponCode
        coupon.usedBy.push(userId);
        await coupon.save();
        
        res.status(200).json({ message: 'Coupon applied successfully', newTotal });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}


// to  remove coupon 
const removeCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user._id;  
    
    try {
        const coupon = await couponSchema.findOne({ couponCode });
        
        const cart = await CartSchema.findOne({ userId });


        const newTotal = cart.totalPrice + coupon.discountAmount;
        
        await CartSchema.findOneAndUpdate({ userId }, { totalPrice: newTotal }, { new: true });

        req.session.coupon = null
        req.session.couponDiscound = 0
        
        await couponSchema.findOneAndUpdate(
            {couponCode},
            { $pull : { usedBy : userId}},
            {new : true}
        )
        
        res.status(200).json({ message: 'Coupon removed successfully', newTotal });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}


// to show availabe coupons
const showCoupons = async (req,res)=>{

    try {

        const userId = req.session.user._id

        const coupon = await couponSchema.find({
            usedBy : { $nin : [userId] }
        })

         res.status(200).json(coupon)
        
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports ={
    applyCoupon,
    removeCoupon,
    showCoupons
}