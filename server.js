const express = require('express');
const session = require("express-session")
const path = require('path');
const userRoutes = require("./routes/user")
const adminRoutes = require('./routes/admin')
const connectDB = require("./db/connectDB")
const User = require('./models/userModel')
const nocache = require("nocache")
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();
const authRoutes = require('./routes/auth');
const Razorpay = require('razorpay');


require("dotenv").config()


const app = express();
app.use(nocache())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Sessions for login (Admin and Users)
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
}));

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));


// Passport.js setup
app.use(passport.initialize());
app.use(passport.session()); 



// Passport Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.YOUR_GOOGLE_CLIENT_ID, 
  clientSecret: process.env.YOUR_GOOGLE_CLIENT_SECRET, 
  callbackURL: 'http://localhost:3000/auth/google/callback' 
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });

  if (!user) {
    user = new User({
      googleId: profile.id,
      username: profile.displayName,
      email: profile.emails[0].value,
      password:"12345678"
    });
    await user.save();
  }
  done(null, user); 
}));


// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});






// Routes

app.use(authRoutes);
app.use("/",userRoutes)
app.use("/admin",adminRoutes)




connectDB()
app.use((req,res,next)=>{
  res.render('error')
})


app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

