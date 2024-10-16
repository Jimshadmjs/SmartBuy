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
  rating: { type: Number, default: 0 }, 
  ratingCount: { type: Number, default: 0 }
},{timestamps:true});

module.exports = mongoose.model('Product', productSchema);
