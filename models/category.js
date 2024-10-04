const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: String,
  isListed: { type: Boolean, default: false }, 
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
