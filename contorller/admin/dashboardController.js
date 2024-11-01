const adminModel = require("../../models/adminModel")
const userSchema = require('../../models/userModel')
const categorySchema = require('../../models/category')
const productSchema = require('../../models/productModel')
const orderSchema = require('../../models/orderModel')
const offerSchama = require('../../models/offerModel')
const path = require('path'); 
const category = require("../../models/category")

const dashboardData =async (req, res) => {
    try {
        const { filter } = req.query;

        // Date filter logic
        let startDate;
        const currentDate = new Date();
        if (filter === 'weekly') startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        else if (filter === 'monthly') startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        else if (filter === 'yearly') startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));

        // Get delivered orders within the filtered date range
        const deliveredOrders = await orderSchema.aggregate([
            { $match: { orderStatus: 'Delivered', orderDate: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    totalOrders: { $count: {} },
                },
            },
        ]);

        // Get top 10 best-selling products
        const bestSellingProducts = await orderSchema.aggregate([
            { $match : { orderStatus : 'Delivered'}},
            { $unwind: '$items' }, 
            {
                $lookup: {
                    from: 'products', 
                    localField: 'items.productID',
                    foreignField: '_id',
                    as: 'product' 
                }
            },
            { $unwind: '$product' }, 
            {
                $group: {
                    _id: {
                        productID: '$product._id', 
                        productName: '$product.name', 
                        productPrice: '$product.price' 
                    },
                    totalQuantity: { $sum: '$items.quantity' }, 
                    totalRevenue : { $sum : { $multiply : ['$items.quantity','$items.price']}}
                },
            },
            {
                $project: {
                    _id: 0, 
                    productID: '$_id.productID',
                    productName: '$_id.productName', 
                    productPrice: '$_id.productPrice',
                    totalQuantity: 1 ,
                    totalRevenue : 1
                }
            },
            { $sort: { totalRevenue: -1 } }, 
            { $limit: 10 } 
        ]);



        const bestSellingCategories = await orderSchema.aggregate([
            { $match : {
                orderStatus : 'Delivered'
            }},
            { $unwind: '$items' }, 
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productID',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }, 
            {
                $lookup: {
                    from: 'categories', 
                    localField: 'product.categoryID',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' }, 
            {
                $group: {
                    _id: {
                        category: '$categoryDetails.name',
                        categoryID: '$categoryDetails._id', 
                    },
                    totalQuantity: { $sum: '$items.quantity' }, 
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            {
                $project: {
                    _id: 0,
                    categoryID: '$_id.categoryID', 
                    category: '$_id.category', 
                    totalQuantity: 1, 
                    totalRevenue: 1, 
                }
            },
            { $sort: { totalRevenue: -1 } }, 
            { $limit: 10 } 
        ]);
        
        
        const users = await userSchema.countDocuments()
        // Send the data as JSON
        res.json({
            totalAmount: deliveredOrders[0]?.totalAmount || 0,
            totalOrders: deliveredOrders[0]?.totalOrders || 0,
            bestSellingProducts,
            bestSellingCategories,
            users
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    dashboardData
}