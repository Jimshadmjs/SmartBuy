const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  images: [String], 
  categoryID: { type: mongoose.Schema.Types.ObjectId, required: true, ref:'Category'},
  stock: Number,
  colors: [String],
  isListed: { type: Boolean, default: true }, 
},{timestamps:true});

module.exports = mongoose.model('Product', productSchema);
