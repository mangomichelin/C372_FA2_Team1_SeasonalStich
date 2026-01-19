const db = require('../db');

const Order = {
    createFromCart: (userId, cart, shipping, callback) => {
        if (!cart || cart.length === 0) return callback(new Error('Cart is empty'));

        db.beginTransaction((err) => {
            if (err) return callback(err);

            const decrementStock = (items, done) => {
                let idx = 0;
                const step = () => {
                    if (idx >= items.length) return done();
                    const hoodieId = items[idx].hoodie_id;
                    const qty = Number(items[idx].quantity);

                    db.query(
                        'UPDATE hoodies SET stock = stock - ? WHERE hoodie_id = ? AND stock >= ?',
                        [qty, hoodieId, qty],
                        (updErr, result) => {
                            if (updErr) return done(updErr);
                            if (!result || result.affectedRows === 0) {
                                return done(new Error('Insufficient stock'));
                            }
                            idx += 1;
                            step();
                        }
                    );
                };
                step();
            };

            const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
            const orderData = {
                user_id: userId,
                total,
                shipping_name: shipping.name,
                shipping_address: shipping.address
            };

            db.query('INSERT INTO orders SET ?', orderData, (orderErr, orderResult) => {
                if (orderErr) {
                    return db.rollback(() => callback(orderErr));
                }

                const orderId = orderResult.insertId;
                const items = cart.map(item => [orderId, item.hoodie_id, item.quantity, item.price]);
                const sql = 'INSERT INTO order_items (order_id, hoodie_id, quantity, price) VALUES ?';

                db.query(sql, [items], (itemsErr) => {
                    if (itemsErr) {
                        return db.rollback(() => callback(itemsErr));
                    }

                    decrementStock(cart, (stockErr) => {
                        if (stockErr) {
                            return db.rollback(() => callback(stockErr));
                        }

                        db.commit((commitErr) => {
                            if (commitErr) {
                                return db.rollback(() => callback(commitErr));
                            }
                            callback(null, { orderId, total });
                        });
                    });
                });
            });
        });
    },

    getByUser: (userId, callback) => {
        const sql = `
            SELECT o.order_id, o.total, o.shipping_name, o.shipping_address, o.created_at
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `;
        db.query(sql, [userId], callback);
    },

    getWithItems: (orderId, callback) => {
        const sql = `
            SELECT o.order_id, o.user_id, o.total, o.shipping_name, o.shipping_address, o.created_at,
                   oi.quantity, oi.price, h.hoodie_id, h.name, h.image_url
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN hoodies h ON oi.hoodie_id = h.hoodie_id
            WHERE o.order_id = ?
        `;

        db.query(sql, [orderId], (err, rows) => {
            if (err) return callback(err);
            if (!rows || rows.length === 0) return callback(null, null);

            const order = {
                order_id: rows[0].order_id,
                user_id: rows[0].user_id,
                total: rows[0].total,
                shipping_name: rows[0].shipping_name,
                shipping_address: rows[0].shipping_address,
                created_at: rows[0].created_at
            };

            const items = rows.map(r => ({
                hoodie_id: r.hoodie_id,
                name: r.name,
                image_url: r.image_url,
                quantity: r.quantity,
                price: r.price
            }));

            callback(null, { order, items });
        });
    }
};

module.exports = Order;
