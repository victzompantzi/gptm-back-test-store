const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// Display login page
router.get("/", loginController.showLoginPage);

// Process login form
router.post("/", loginController.handleLogin);

// Middleware to protect routes by ensuring the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (!req.cookies || !req.cookies.token) {
    return res.redirect("/login");
  }
  next();
}

module.exports = router;
module.exports.ensureAuthenticated = ensureAuthenticated;
