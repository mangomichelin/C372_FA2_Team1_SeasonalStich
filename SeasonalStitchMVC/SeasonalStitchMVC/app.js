const express = require('express');
// const bodyParser = require('body-parser'); // not needed, use express built-in
const session = require('express-session');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// ensure Express knows where your views folder is (your folder is "Views")
app.set('views', path.join(__dirname, 'Views'));
app.set('view engine', 'ejs');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'Public', 'images')); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware setup
app.use(express.urlencoded({ extended: true })); // replace body-parser
app.use(express.static(path.join(__dirname, 'Public'))); // match your Public folder name

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'seasonalSecret',
    resave: false,
    saveUninitialized: true
}));

// Controllers
const ProductController = require('./Controllers/ProductController');
const CartController = require('./Controllers/CartController');
const OrderController = require('./Controllers/OrderController');
const AdminController = require('./Controllers/AdminController');
const CategoryController = require('./Controllers/CategoryController');
const Hoodie = require('./Models/Hoodie');
const User = require('./Models/User');
const UserController = require('./Controllers/UserController');


// Middleware for authentication
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    next();
};

// Routes
// Homepage and inventory
app.get('/', ProductController.list);
app.get('/inventory', ProductController.list);
app.get('/hoodie/:id', ProductController.getById);

// Cart routes (login required)
app.get('/cart', requireAuth, CartController.viewCart);
app.post('/cart/add/:id', requireAuth, CartController.addItem);
app.post('/cart/update/:id', requireAuth, CartController.updateQuantity);
app.post('/cart/remove/:id', requireAuth, CartController.removeItem);
app.post('/cart/clear', requireAuth, CartController.clearCart);

// Checkout & orders
app.get('/order-summary/:id', requireAuth, OrderController.summaryByOrderId);
app.get('/checkout', requireAuth, OrderController.checkoutPage);
app.post('/checkout', requireAuth, OrderController.placeOrder);
app.get('/orders', requireAuth, OrderController.history);

// Admin routes - Add/Edit/Delete hoodies
app.get('/addHoodie', requireAdmin, (req, res) => {
    res.render('add', { user: req.session.user });
});

app.post('/addHoodie', requireAdmin, upload.single('image'), ProductController.add);

app.get('/editHoodie/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    Hoodie.getById(id, (err, hoodie) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving hoodie');
        }
        if (!hoodie) return res.status(404).send('Hoodie not found');
        res.render('update', { hoodie, user: req.session.user });
    });
});

app.post('/editHoodie/:id', requireAdmin, upload.single('image'), ProductController.update);
app.get('/deleteHoodie/:id', requireAdmin, ProductController.delete);

// Admin dashboard & categories
app.get('/admin/dashboard', requireAdmin, AdminController.dashboard);
app.get('/admin/categories', requireAdmin, CategoryController.list);
app.get('/admin/categories/:id', requireAdmin, CategoryController.get);
app.post('/admin/categories', requireAdmin, CategoryController.add);
app.post('/admin/categories/:id', requireAdmin, CategoryController.update);
app.get('/admin/categories/delete/:id', requireAdmin, CategoryController.delete);

// Temporary quick-login routes for testing (you can remove later)
app.get('/loginAdmin', (req, res) => {
    req.session.user = { user_id: 1, full_name: 'Admin User', role: 'admin' };
    res.send('Logged in as admin. <a href="/">Go home</a>');
});

app.get('/loginUser', (req, res) => {
    req.session.user = { user_id: 2, full_name: 'Normal User', role: 'user' };
    res.send('Logged in as user. <a href="/">Go home</a>');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// Login and Register routes
app.get('/login', (req, res) => res.render('login'));
app.post('/login', UserController.login);
app.get('/register', (req, res) => res.render('register'));
app.post('/register', UserController.register);

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
