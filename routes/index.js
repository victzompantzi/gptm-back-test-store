var express = require('express');
require('dotenv').config();
var router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render('index', { title: 'Doguito API' });
});

module.exports = router;
