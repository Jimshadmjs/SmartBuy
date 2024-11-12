const mongoose = require("mongoose")

const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect('mongodb+srv://smartbuy:Jimshad925@smartbuy.revi6.mongodb.net/SmartBuy?retryWrites=true&w=majority&appName=SmartBuy',{
       
        })
        
    }catch(error){
        
        process.exit(1)
        
    }
}
module.exports = connectDB