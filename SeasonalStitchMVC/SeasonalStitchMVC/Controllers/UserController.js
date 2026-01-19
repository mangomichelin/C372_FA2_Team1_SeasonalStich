const User = require('../Models/User');

const UserController = {
    register: (req, res) => {
        const { full_name, email, password } = req.body;
        User.register(full_name, email, password, (err) => {
            if (err) return res.render('register', { error: 'Registration failed' });
            res.redirect('/login');
        });
    },

    login: (req, res) => {
        const { email, password } = req.body;
        User.authenticate(email, password, (err, user) => {
            if (err) return res.render('login', { error: 'Server error' });
            if (!user) return res.render('login', { error: 'Invalid email or password' });
            req.session.user = user;
            res.redirect('/');
        });
    },

    logout: (req, res) => {
        req.session.destroy(() => res.redirect('/'));
    }
};

module.exports = UserController;
