const express = require("express");
require('dotenv').config();
const router = express.Router();

// GET login form
router.get("/", (req, res) => {
  res.render("login", { error: null });
});

// POST login data
router.post("/", (req, res) => {
  const { username, password } = req.body;
  // Simple static credential check
  if (username === "admin" && password === "secret") {
    req.session.user = username;
    return res.redirect("/");
  }
  res.render("login", { error: "Invalid credentials" });
});

module.exports = router;
