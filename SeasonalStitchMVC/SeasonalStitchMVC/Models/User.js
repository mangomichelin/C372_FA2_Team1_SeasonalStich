// models/User.js
const db = require('../db');

const User = {
    // Register a new user (plain text password for simplicity)
    register: (full_name, email, password, callback) => {
        const sql = 'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, "user")';
        db.query(sql, [full_name, email, password], callback);
    },

    // Authenticate user with plain text password
    authenticate: (email, password, callback) => {
        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        db.query(sql, [email, password], (err, results) => {
            if (err) return callback(err);
            if (results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    }
};

module.exports = User;
