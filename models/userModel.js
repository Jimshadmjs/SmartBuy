const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    googleId: String,
    username: { type: String , require:true},
    email: { type: String, required: true, unique: true },
    password: { type: String , require:true},  
    phone:{type:Number,required:false},
    dob:{type:Date},
    profilePicture: String,
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

// Password hashing before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare password for login 
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);

