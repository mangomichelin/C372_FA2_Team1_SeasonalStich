const path = require("path");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
require("dotenv").config();

const ProductController = require("./Controllers/ProductController");
const UserController = require("./Controllers/UserController");
const CartController = require("./Controllers/CartController");
const OrderController = require("./Controllers/OrderController");
const AdminController = require("./Controllers/AdminController");
const ReportController = require("./Controllers/ReportController");
const ReviewController = require("./Controllers/ReviewController");
const paymentRoutes = require("./routes/paymentRoutes");
const stripeRoutes = require("./routes/stripeRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "seasonalstitch_secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static(path.join(__dirname, "Public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "Public", "images"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "");
    const safeBase = base ? base.slice(0, 40) : "upload";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}-${unique}${ext}`);
  }
});
const upload = multer({ storage });

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  return next();
};

app.get("/", ProductController.list);

app.get("/login", (req, res) => res.render("login"));
app.get("/loginUser", (req, res) => res.redirect("/login"));
app.post("/login", UserController.login);
app.get("/register", (req, res) => res.render("register"));
app.post("/register", UserController.register);
app.get("/logout", UserController.logout);

app.get("/addHoodie", requireAdmin, (req, res) => {
  res.render("add", { user: req.session.user });
});
app.post("/addHoodie", requireAdmin, upload.single("image"), ProductController.add);
app.get("/editHoodie/:id", requireAdmin, ProductController.getById);
app.post(
  "/editHoodie/:id",
  requireAdmin,
  upload.single("image"),
  ProductController.update
);
app.get("/deleteHoodie/:id", requireAdmin, ProductController.delete);

app.get("/cart", requireAuth, CartController.viewCart);
app.post("/cart/add/:id", requireAuth, CartController.addItem);
app.post("/cart/update/:id", requireAuth, CartController.updateQuantity);
app.post("/cart/remove/:id", requireAuth, CartController.removeItem);
app.post("/cart/clear", requireAuth, CartController.clearCart);

app.get("/checkout", requireAuth, OrderController.checkoutPage);
app.post("/checkout/promo", requireAuth, OrderController.applyPromo);
app.post("/checkout", requireAuth, OrderController.placeOrder);
app.post("/checkout/paypal-complete", requireAuth, OrderController.placeOrderPaypal);
app.get("/checkout-success/:id", requireAuth, OrderController.checkoutSuccess);
app.get("/order-summary/:id", requireAuth, OrderController.summaryByOrderId);
app.get("/invoice/:id/view", requireAuth, OrderController.invoicePage);
app.get("/invoice/:id", requireAuth, OrderController.invoicePdf);
app.get("/track/:id", requireAuth, OrderController.trackingPage);
app.get("/orders", requireAuth, OrderController.history);
app.post("/orders/:id/refund", requireAuth, OrderController.requestRefund);
app.post("/reviews/:orderId/:hoodieId", requireAuth, ReviewController.submit);

app.get("/admin/orders", requireAdmin, OrderController.adminHistory);
app.post("/admin/orders/:id/status", requireAdmin, OrderController.updateStatus);
app.post("/admin/orders/:id/refund", requireAdmin, OrderController.resolveRefund);
app.post("/admin/orders/:id/tracking", requireAdmin, OrderController.updateTracking);
app.get("/admin/dashboard", requireAdmin, AdminController.dashboard);
app.post("/admin/restock/:id", requireAdmin, AdminController.restockHoodie);
app.get("/inventory", requireAdmin, AdminController.inventoryPage);
app.get("/admin/categories", requireAdmin, AdminController.categoriesPage);
app.get("/admin/reports", requireAdmin, ReportController.adminReport);
app.get("/admin/users", requireAdmin, AdminController.usersPage);
app.post("/admin/users/:id/points", requireAdmin, AdminController.updateUserPoints);

app.use("/", paymentRoutes);
app.use("/stripe", requireAuth, stripeRoutes);

app.listen(PORT, () => {
  console.log(`Seasonal Stitch running on port ${PORT}`);
});
