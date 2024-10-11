const express = require('express');
const passport = require('passport');
const session = require("express-session")
const userSchema = require('../models/userModel')

const router = express.Router();

// Route to start Google OAuth process
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'] 
}));

// Callback route that Google redirects to
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    let user = req.user
  if(user.isBlocked){
    res.redirect('/login?message=User is Blocked')
  } else{

    req.session.user=user
    res.redirect('/');
  }

  }
);

// Logout route
// router.get('/logout', (req, res) => {
//   req.logout();
//   delete req.session.user
//   res.redirect('/');
// });

module.exports = router;
