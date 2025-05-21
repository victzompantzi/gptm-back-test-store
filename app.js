// https://e-commerce.blumonpay.net/checkout/yHUHrqitqiqmF32
require("dotenv").config(); // new code
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const productosCrudRouter = require("./routes/productos-crud");
// const productosCrudRouter = require("./routes/productos-render");
const loginRouter = require("./routes/login");

// New: require the authentication middleware
const { verifyToken } = require("./middlewares/auth");

// Add a require statement for productosService
const productosService = require("./services/db-service"); // Ensure this file exists at './services/productosService.js'

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Add global authentication middleware (skip /login and /logout)
app.use((req, res, next) => {
  if (req.path.startsWith("/login") || req.path.startsWith("/logout"))
    return next();
  verifyToken(req, res, next);
});

// Unauthenticated route
app.use("/login", loginRouter);

// Redirect root based on token presence
app.get("/", (req, res) => {
  if (req.cookies && req.cookies.token) {
    return res.redirect("/views/productos.html"); // changed code: redirect to productos view
  }
  res.redirect("/login");
});

// Protect dashboard route:
app.use("/dashboard", indexRouter);

// Mount the unified productos router (handles both view and API endpoints)
// Previously: app.use("/productos", productosCrudRouter);
// and app.use("/api/productos", productosCrudRouter);
app.use("/productos", productosCrudRouter);

// Logout route remains the same
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  // Log the unmatched request
  console.error(`NotFoundError: ${req.originalUrl} not found`);
  next(createError(404, `Route ${req.originalUrl} not found`));
});

// error handler
app.use((err, req, res, next) => {
  // added next parameter for consistency
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Initialize productosService and then start the server
productosService
  .init()
  .then((productosServiceInstance) => {
    app.set("productosService", productosServiceInstance);

    // Start the server only after productosService is ready
    if (require.main === module) {
      const IP = process.env.IP || "40.233.31.154";
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, IP, () => {
        console.log(`Server running at http://${IP}:${PORT}/`);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to initialize productosService:", err);
    process.exit(1);
  });

// Ensure safe shutdown
process.on("exit", () => {
  const service = app.get("productosService");
  if (service) service.closePool();
});

module.exports = app;
