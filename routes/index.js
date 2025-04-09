var express = require("express");
require("dotenv").config();
var router = express.Router();
const { ensureAuthenticated } = require("../routes/login");

// Home
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("index", { title: "Doguito API" });
});

module.exports = router;
