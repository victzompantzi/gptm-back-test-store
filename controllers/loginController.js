// New file: define login handlers here
exports.showLoginPage = (req, res) => {
  // Render login view
  res.render("login");
};

exports.handleLogin = async (req, res) => {
  // ...validate credentials...
  // generate token and set cookie
  // For example:
  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ user: req.body.username }, "secret", {
    expiresIn: "1h",
  });
  res.cookie("token", token, { httpOnly: true });
  // Redirect to productos view instead of dashboard after login
  res.redirect("/views/productos.html");
};
