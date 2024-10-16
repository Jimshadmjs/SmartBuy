const adminModel = require("../../models/adminModel")
const userSchema = require('../../models/userModel')
const categorySchema = require('../../models/category')
const productSchema = require('../../models/productModel')
const orderSchema = require('../../models/orderModel')
const offerSchama = require('../../models/offerModel')
const multer = require('multer');
const bcrypt = require('bcrypt')

// to render offer management 

const offer = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 5; 
    
        const offers = await offerSchama.find().sort({ createdAt: -1 })
            .populate('selectedProducts') 
            .populate('selectedCategory') 
            .populate('target') 
            .limit(limit)
            .skip((page - 1) * limit);
    console.log(offers);
    
        const totalOffers = await offerSchama.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);
    
        res.render('admin/offer', { offers, currentPage: page, totalPages });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).send('Internal Server Error');
    }
    
}


// to show products
const products = async (req,res)=>{
    try {
        const products = await productSchema.find(); 
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products' });
    }
}



// to show categories
const categories = async (req, res) => {
    try {
        const categories = await categorySchema.find(); 
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Error fetching categories' });
    }
}


//to add new offer
const addOffer = async (req, res) => {
    try {

        const { title, discountAmount, startDate, endDate, targetType, target, selectedProducts,selectedCategory } = req.body;
        console.log(selectedCategory);
        
        
        const newOffer = new offerSchama({
            title,
            discountAmount,
            startDate,
            endDate,
            targetType,
            target,
            selectedProducts, 
            selectedCategory
        });

        if (targetType === 'Product') {
            newOffer.selectedProducts.push(target); 
        } else if (targetType === 'Category') {
            newOffer.selectedProducts.push(target); 
        }

        const savedOffer = await newOffer.save();
        return res.status(201).json(savedOffer); 
    } catch (error) {
        console.error('Error creating offer:', error);
        return res.status(500).json({ message: 'Failed to create offer', error });
    }
}



// to edit offers
const editOffer = async (req, res) => {
    const { id, title, discountAmount, startDate, endDate, targetType, selectedProducts, selectedCategory } = req.body;

    try {
        const result = await offerSchama.updateOne(
            { _id: id }, // Query to find the document
            {
                $set: {
                    title,
                    discountAmount,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    targetType,
                    selectedProducts,
                    selectedCategory,
                }
            }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Offer not found or no changes made' });
        }

        res.json({ message: 'Offer updated successfully' });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}


// to activate offer
const activate =  async (req, res) => {
    const { id } = req.body;

    try {
        const result = await offerSchama.updateOne(
            { _id: id },
            { $set: { isActive: true } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Offer not found or already active' });
        }

        res.json({ message: 'Offer activated successfully' });
    } catch (error) {
        console.error('Error activating offer:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}


// to deactivate
const deactivate = async (req, res) => {
    
    
    const { id } = req.body;

    try {
        const result = await offerSchama.updateOne(
            { _id: id },
            { $set: { isActive: false } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Offer not found or already inactive' });
        }

        res.json({ message: 'Offer deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating offer:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}



module.exports={
    offer,
    products,
    categories,
    addOffer,
    editOffer,
    activate,
    deactivate
}