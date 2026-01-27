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
    },

    getById: (userId, callback) => {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        db.query(sql, [userId], (err, results) => {
            if (err) return callback(err);
            if (!results || results.length === 0) return callback(null, null);
            callback(null, results[0]);
        });
    },

    getAll: (callback) => {
        const sql = 'SELECT user_id, full_name, email, role, points FROM users ORDER BY full_name';
        db.query(sql, callback);
    },

    updatePoints: (userId, points, callback) => {
        const sql = 'UPDATE users SET points = ? WHERE user_id = ?';
        db.query(sql, [points, userId], callback);
    }
};

module.exports = User;
