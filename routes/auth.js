const express = require('express');
const passport = require('passport');
const session = require("express-session")
const userSchema = require('../models/userModel')

const router = express.Router();

// Route to start Google OAuth process
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'] // Request profile and email from Google
}));

// Callback route that Google redirects to
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
 async (req, res) => {

  
    
    req.session.user=true
    res.redirect('/');
  }
);

// Logout route
// router.get('/logout', (req, res) => {
//   req.logout();
//   delete req.session.user
//   res.redirect('/');
// });

module.exports = router;
