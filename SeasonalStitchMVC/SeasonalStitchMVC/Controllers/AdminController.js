const db = require('../db');

const countTable = (table, cb) => {
    db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
        if (err) return cb(err);
        cb(null, results[0].count);
    });
};

const AdminController = {
    dashboard: (req, res) => {
        const stats = {};
        countTable('users', (err, userCount) => {
            if (err) return res.status(500).send('Failed to load dashboard');
            stats.users = userCount;
            countTable('hoodies', (err2, hoodieCount) => {
                if (err2) return res.status(500).send('Failed to load dashboard');
                stats.hoodies = hoodieCount;
                countTable('orders', (err3, orderCount) => {
                    if (err3) return res.status(500).send('Failed to load dashboard');
                    stats.orders = orderCount;
                    res.render('admin', { stats, user: req.session.user });
                });
            });
        });
    },

    categoriesPage: (req, res) => {
        res.redirect('/admin/dashboard'); // placeholder; categories listing can be added here
    }
};

module.exports = AdminController;
