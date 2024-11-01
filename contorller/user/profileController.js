const userSchema = require("../../models/userModel")
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const productSchema = require('../../models/productModel')
const categorySchema = require('../../models/category')
const addressSchema = require('../../models/addressModel')
const orderSchema = require('../../models/orderModel')
const CartSchema = require('../../models/cartModel')
const offerSchema = require('../../models/offerModel')
const wishlistSchema = require('../../models/wishlistModel')
const walletSchema = require('../../models/walletModel')
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
require("dotenv").config()




// to render profile
const profile = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const user = await userSchema.findById(userId);
        if (!user) return res.redirect('/');

        const addresses = await addressSchema.find({ user: userId });

        const wallet = await walletSchema.findOne({userId }) || { 
                    balance: 0, 
                    transactions: [] 
                };

        const latestTransactions = wallet.transactions
        .sort((a, b) => b.date - a.date) 
        .slice(0, 6);

        const page = parseInt(req.query.page) || 1;
        const limit = 5; 
        const skip = (page - 1) * limit;

        const totalOrders = await orderSchema.countDocuments({ userID: userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await orderSchema
            .find({ userID: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.productID');

        res.status(200).render('user/profile', { 
            user, 
            addresses, 
            orders, 
            currentPage: page, 
            totalPages,
            wallet: {
                balance: wallet.balance,
                transactions: latestTransactions 
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch user details' });
    }
};




// to add new address
const addAddress = async (req,res)=>{

    const { fullName, phone, address, district, city, state, pincode, country, type } = req.body;
    const user = req.params.id
    
    if (!user) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const newAddress = new addressSchema({
            user,
            fullName,
            phone,
            address,
            district,
            city,
            state,
            pincode,
            country,
            type
        });

        await newAddress.save();
        res.status(200).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
        res.status(400).json({ message: 'Error adding address', error: error.message });
    }
}


// edit address
const editAddress = async (req,res)=>{    

    const { fullName, phone, address, district, city, state, pincode, country, type } = req.body;
    const addressId = req.params.id;
    
    const existingAddress = await addressSchema.findById(addressId);
    console.log(existingAddress);
    
    if (!existingAddress) {
        return res.status(404).json({ message: 'Address not found.' });
    }
    
    try {
        // Update address fields
        existingAddress.fullName = fullName;
        existingAddress.phone = phone;
        existingAddress.address = address;
        existingAddress.district = district;
        existingAddress.city = city;
        existingAddress.state = state;
        existingAddress.pincode = pincode;
        existingAddress.country = country;
        existingAddress.type = type;
    
        // Save the updated address
        const updatedAddress = await existingAddress.save();
        
        // Return the updated address
        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        console.error('Error updating address:', error); // Log the error for debugging
        res.status(500).json({ message: 'Error updating address', error: error.message });
    }
         
}


// to delete address
const daleteAddress = async (req,res)=>{

    const addressId = req.params.id;

    try {

        const deletedAddress = await addressSchema.findByIdAndDelete(addressId);
        
        if (!deletedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Error deleting address', error: error.message });
    }

}



// update user detials

const updateDetails = async (req,res)=>{

    const { username, email } = req.body;

    const user = req.params.id
    

        await userSchema.findByIdAndUpdate(user, { username, email }, { new: true })

        .then(updatedUser => {

            res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
        })

        .catch(error => {

            res.status(500).json({ error: 'Failed to update profile' });

        });

}



// to cancel order

const cancelOrder =  async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.cancellationRequested = true;
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ message: 'Cancellation request submitted successfully. Awaiting admin approval.' });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({ message: 'An error occurred while submitting the cancellation request.' });
    }
};




// to return order

const returnOrder =  async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body; 

    try {
        const order = await orderSchema.findById(orderId);
        if (!order) {
            return res.status(404).json({ success:false });
        }

        order.cancellationRequested = true;
        order.cancellationReason = reason;
        await order.save();

        res.status(200).json({ success:true });
    } catch (error) {
        console.error('Error submitting cancellation request:', error);
        res.status(500).json({success:false });
    }
};







// order details

const orderDetails = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findById(orderId).populate('items.productID'); 

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            orderedDate: order.createdAt, 
            orderStatus: order.orderStatus,
            shippingAddress: order.shippingAddress,
            items: order.items,
            totalAmount: order.totalAmount,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'An error occurred while fetching the order details' });
    }
}



// to download invoice
const generateInvoice = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findById(orderId).populate('items.productID');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `Invoice_${orderId}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        const rowHeight = 30;
        let x = 50, y = 220; // Starting position

        // Title
        doc.fontSize(25).text('Invoice', { align: 'center' });
        doc.moveDown();

        // Order Date
        const orderDate = `Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`;
        doc.fontSize(12).text(orderDate, { align: 'center' }).moveDown();

        // Shipping Address
        doc.text('Shipping Address:', { underline: true, fontSize: 14 });
        doc.text(`${order.shippingAddress.fullname}`, { align: 'left' });
        doc.text(`${order.shippingAddress.address}`, { align: 'left' });
        doc.text(`Pincode: ${order.shippingAddress.pincode}`, { align: 'left' });
        doc.moveDown(); // Add space before the table

        // Table headers
        const headers = ['Product Name', 'Quantity', 'Price', 'Total'];
        const widths = [200, 100, 100, 100];

        // Draw header row
        headers.forEach((header, index) => {
            doc.rect(x, y, widths[index], rowHeight).stroke();
            doc.fontSize(10).text(header, x + 5, y + 10, { width: widths[index], align: 'center' });
            x += widths[index];
        });

        x = 50; // Reset x position for the first row
        y += rowHeight; // Move down for the next row

        // Draw product rows
        let totalAmount = 0;
        order.items.forEach(item => {
            const price = item.productID.price;
            const quantity = item.quantity;
            const rowTotal = price * quantity;
            totalAmount += rowTotal;

            const row = [
                item.productID.name,
                quantity,
                `${price.toFixed(2)}`,
                `${rowTotal.toFixed(2)}`
            ];

            row.forEach((cell, index) => {
                doc.rect(x, y, widths[index], rowHeight).stroke();
                doc.fontSize(8).text(cell, x + 5, y + 10, { width: widths[index], align: 'center' });
                x += widths[index];
            });

            x = 50; // Reset x position for the next row
            y += rowHeight; // Move down for the next row
        });

        // Add space before the total amount row
        y += 10; // Add extra space before total amount
        doc.fontSize(10).text(`Total Amount: ${totalAmount.toFixed(2)}`, 55, y + 10, { align: 'right' });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('An error occurred while generating the PDF.');
    }
};





module.exports={
    profile,
    addAddress,
    editAddress,
    daleteAddress,
    updateDetails,
    cancelOrder,
    orderDetails,
    returnOrder,
    generateInvoice
}