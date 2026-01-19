// models/Hoodie.js
const db = require('../db');

// Model for interacting with the "hoodies" table
const Hoodie = {
    getAll: (callback) => {
        const sql = 'SELECT * FROM hoodies';
        db.query(sql, callback);
    },

    getById: (id, callback) => {
        const sql = 'SELECT * FROM hoodies WHERE hoodie_id = ?';
        db.query(sql, [id], (err, results) => {
            if (err) return callback(err);
            callback(null, results[0]);
        });
    },

    add: (data, callback) => {
        const sql = 'INSERT INTO hoodies (name, description, price, image_url, stock, season) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [data.name, data.description, data.price, data.image_url, data.stock, data.season], callback);
    },

    update: (id, data, callback) => {
        const sql = 'UPDATE hoodies SET name=?, description=?, price=?, image_url=?, stock=?, season=? WHERE hoodie_id=?';
        db.query(sql, [data.name, data.description, data.price, data.image_url, data.stock, data.season, id], callback);
    },

    delete: (id, callback) => {
        const sql = 'DELETE FROM hoodies WHERE hoodie_id = ?';
        db.query(sql, [id], callback);
    }
};

module.exports = Hoodie;
