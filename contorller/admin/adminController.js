const adminModel = require("../../models/adminModel")
const User = require('../../models/userModel')
const categorySchema = require('../../models/category')
const productSchema = require('../../models/productModel')
const orderSchema = require('../../models/orderModel')
const multer = require('multer');
const bcrypt = require('bcrypt')


// Multer setup
const storage = multer.memoryStorage(); // Store images in memory
const upload = multer({ storage });


// render login page
const login = (req,res)=>{

    const message = req.query.message

    res.render("admin/login",{msg:message})
}


// get info and redirect home
const loggedIn = async (req,res)=>{
    try {
    const {email,password} = req.body

    const admin = await adminModel.findOne({email})

    if(!admin) return res.redirect("/admin/login?message=Invalid Credentials")
        console.log(admin);

    const isMatch = await bcrypt.compare(password,admin.password)

    if(!isMatch) return res.redirect("/admin/login?message=Wrong Password")

    req.session.admin = true
    
    res.redirect("/admin/dashboard")
        
    } catch (error) {
        console.log("error");
        
    }

}



//render home page
const dashboard = (req,res)=>{
    res.status(200).render('admin/dashboard')
}




// render userManagement
const users = async (req, res) => {
try {
    const page = parseInt(req.query.page) || 1; 

    const limit = 8; 
    const offset = (page - 1) * limit; 

    const totalUsers = await User.countDocuments(); 
    const totalPages = Math.ceil(totalUsers / limit); 

    const users = await User.find().sort({ createdAt: -1 }).skip(offset).limit(limit); 

    res.status(200).render('admin/users', {
        users,
        currentPage: page,
        totalPages: totalPages,
    });
    
} catch (error) {
    console.log("error");
    
}

};


// to block user
const isBlock = async (req,res)=>{
    try {
    const userId = req.params.id
    const {isBlocked} = req.body
    

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({success:false, message:"The user is not exists"});
        }
        
        user.isBlocked = isBlocked;
        req.session.user=false
        await user.save();
        res.status(200).json({success:true, message:`The user status is changed`, isBlocked:user.isBlocked})

    } catch (error) {
        res.status(500).send('Server error');
    }
}

//render categoryManagement
const category = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; 
    
        const limit = 4; 
        const offset = (page - 1) * limit; 
    
        const totalCategories = await categorySchema.countDocuments(); 
        const totalPages = Math.ceil(totalCategories / limit); 
    
        const category = await categorySchema.find().skip(offset).limit(limit); 

        const message = req.query.message
    
        res.status(200).render('admin/category', {
            msg:message,
            category,
            currentPage: page,
            totalPages: totalPages,
        });
        
    } catch (error) {
        console.log("error");
        
    }
}


//to add new category
const addCategory = async (req,res)=>{
    try {

        const name = req.body.name

        const category = await categorySchema.findOne({name})

        if(category) return res.redirect('/admin/category?message=Category alreasy exist')

        const newCategory = new categorySchema({name})
        
        await newCategory.save()

        res.redirect('/admin/category')

    } catch (error) {

        res.status(500).send("Internal Server Error")
        
    }
}

// to list category
const listCategory = async (req,res)=>{
    try {
        const categoryId = req.params.id
        const {isListed} = req.body
        
    
            const category = await categorySchema.findById(categoryId);
            if (!category) {
                return res.status(404).json({success:false, message:"The category is not exists"});
            }
            
            category.isListed = isListed;
            await category.save();
            res.status(200).json({success:true, message:`The category status is changed`, isListed:category.isListed})
    
        } catch (error) {
            res.status(500).send('Server error');
        }
}


//edit category

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryName = req.body.name;

        // Find the existing category by ID
        const category = await categorySchema.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }

        // Check if a different category with the same name exists
        const categoryExist = await categorySchema.findOne({ name: categoryName });
        if (categoryExist && categoryExist._id.toString() !== categoryId) {
            return res.status(400).json({ success: false, message: "A category with this name already exists." });
        }

        // Update the category name
        category.name = categoryName;
        await category.save();

        res.status(200).json({ success: true, message: "Category has been updated." });
    } catch (error) {
        console.error(error); 
        res.status(500).send("Internal Server Error");
    }
};


// to render product management

const products = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; 
        const skip = (page - 1) * limit;
    
        const categories = await categorySchema.find()
        const products = await productSchema.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'categoryID',
                select: 'name'
            });
    
        const totalProducts = await productSchema.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);
    
        const formattedProducts = products.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            description: product.description,
            images: product.images,
            stock: product.stock,
            colors: product.colors,
            isListed: product.isListed,
            categoryID: product.categoryID ? product.categoryID.name : 'Unknown' 
        }));
        console.log(formattedProducts);
        
        
        res.render('admin/product', {
            products: formattedProducts,
            currentPage: page,
            totalPages,
            categories
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send("Internal Server Error");
    }
    

}


// to add product
const add_product = async (req, res) => {
    console.log(req.body);
    
    try {
      
      const imageName = req.files.map((file) => file.filename);
  
      // Create a new product document
      const newProduct = new productSchema({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        categoryID: req.body.categoryID,
        stock: req.body.stock,
        colors: req.body.colors ? req.body.colors.split(",") : [], 
        description: req.body.description,
        images: imageName,
      });
  
  
      console.log(newProduct)
  
      // Save the new product to the database
      await newProduct.save();  
      
      res.status(201).redirect("/admin/product");
      
    } catch (error) {
      console.error(error);
      
      return res.status(500).send("An error occurred while adding the product.");
    }
}
  


// to edit product

const edit_product = async (req,res)=>{
    try {
        const product = await productSchema.findById(req.params.id).populate({
            path: 'categoryID',
            select: 'name'
        });;
        if (!product) return res.status(404).send('Product not found');
        res.json(product);
    } catch (error) {
        res.status(500).send('Server error');
    }
}


// change the edit product
const change_file =async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.categoryID = req.body.categoryID || product.categoryID;
        product.stock = req.body.stock || product.stock;
        product.price = req.body.price || product.price;
        product.colors = JSON.parse(req.body.colors) || product.colors;

        // Replace images if they are uploaded
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                if (index < product.images.length) {
                    product.images[index] = file.filename; 
                }
            });
        }

        await product.save();
        res.status(200).json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Internal Server Error');
    }
};
  


// toggle-list of product
const toggle_list = async (req, res) => {
    try {
        console.log("jkna");
        
      const productId = req.params.id;
      const { isListed } = req.body;  
  
      if (typeof isListed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "Invalid listing status provided",
        });
      }
  
      console.log(productId, isListed);
      const product = await productSchema.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "The product does not exist" });
      }
  
      product.isListed = isListed; 
      await product.save();
  
      res.status(200).json({
        success: true,
        message:" The product listing status has been changed",
        isListed: product.isListed,
      });
    } catch (error) {
      console.error("Error toggling product listing:", error);
      res.status(500).send("Server error");
   }
  };




// logout
const logout = (req,res)=>{
    try {
        req.session.admin=false
        res.redirect('/admin/login')

    } catch (error) {
      res.status(500).send("Server error");
        
    }
}




// to render order management
const order = async (req, res) => {
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10; 

    try {
        const totalOrders = await orderSchema.countDocuments();
        const orders = await orderSchema.find()
            .sort({ createdAt: -1 })
            .populate('userID') 
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        const currentPageStock = parseInt(req.query.pageStock) || 1;
        const totalStockItems = await productSchema.countDocuments();
        const products = await productSchema.find()
            .skip((currentPageStock - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPagesStock = Math.ceil(totalStockItems / itemsPerPage);

        res.render('admin/orders', {
            orders,
            products,
            currentPage,
            totalPages,
            currentPageStock,
            totalPagesStock
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}



// to change order status
const changeStatus = (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).send({ message: 'Invalid status' });
    }

    orderSchema.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true })
        .then(updatedOrder => res.send(updatedOrder))
        .catch(err => res.status(500).send({ message: 'Failed to update order status', error: err }));
}


// to approve cancel request
const approveCancellation = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderSchema.findOneAndUpdate(
            { _id: orderId },
            { 
                orderStatus: 'Cancelled',
                cancellationRequested: false 
            },
            { new: true } 
        );

        
        

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order cancelled successfully.' });
    } catch (error) {
        console.error('Error approving cancellation:', error);
        res.status(500).json({ message: 'An error occurred while cancelling the order.' });
    }
};



module.exports={
    login,
    loggedIn,
    dashboard,
    users,
    isBlock,
    category,
    addCategory,
    listCategory,
    editCategory,
    products,
    add_product,
    edit_product,
    change_file,
    toggle_list,
    logout,
    order,
    changeStatus,
    approveCancellation
}