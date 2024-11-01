const userSchema = require("../../models/userModel")
const productSchema = require('../../models/productModel')
const categorySchema = require('../../models/category')
const addressSchema = require('../../models/addressModel')
const orderSchema = require('../../models/orderModel')
const CartSchema = require('../../models/cartModel')
const offerSchema = require('../../models/offerModel')
const couponSchema = require('../../models/couponModel')
const wishlistSchema = require('../../models/wishlistModel')
const walletSchema = require('../../models/walletModel')


// to add funds in wallet

const add_fund = async (req, res) => {
    try {
        const userId = req.session.user._id // Ensure userID is an ObjectId

        // Find the user's wallet or create a new one if not found
        let wallet = await walletSchema.findOne({  userId });

        if (!wallet) {
            console.log('No wallet found. Creating a new one...');
            // Create a new wallet with an initial balance from the request
            wallet = new walletSchema({
                userId,
                balance: req.body.amount,
                transactions: [
                    {
                        date: new Date(),
                        description: 'Initial deposit',
                        type: 'credit',
                        amount: req.body.amount,
                    },
                ],
            });
        } else {
            console.log('Wallet found. Updating the balance...');
            // Update the existing wallet's balance and add a new transaction
            wallet.balance += req.body.amount;
            wallet.transactions.push({
                date: new Date(),
                description: 'Deposit',
                type: 'credit',
                amount: req.body.amount,
            });
        }

        // Save the wallet to the database
        await wallet.save();

        res.status(200).json({
            success: true,
            message: 'Funds added successfully!',
            newBalance: wallet.balance,
        });
    } catch (error) {
        console.error('Error adding funds:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.',
        });
    }
}


// to show transactions 
const transaction = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const wallet = await walletSchema.findOne({ userId });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        const latestTransactions = wallet.transactions
        .sort((a, b) => b.date - a.date)
        return res.json(latestTransactions); // Send all transactions
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to fetch transactions' });
    }
}



module.exports ={
    add_fund,
    transaction
}