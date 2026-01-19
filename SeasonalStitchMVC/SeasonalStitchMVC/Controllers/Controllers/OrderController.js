const Order = require('../Models/Order');

const OrderController = {
    checkoutPage: (req, res) => {
        const cart = req.session.cart || [];
        if (!cart.length) return res.redirect('/cart');
        const totals = cart.reduce(
            (acc, item) => {
                acc.items += item.quantity;
                acc.total += Number(item.price) * item.quantity;
                return acc;
            },
            { items: 0, total: 0 }
        );
        res.render('checkout', { cart, totals, user: req.session.user });
    },

    placeOrder: (req, res) => {
        const cart = req.session.cart || [];
        if (!cart.length) return res.redirect('/cart');

        const shipping = {
            name: req.body.shipping_name || '',
            address: req.body.shipping_address || ''
        };

        Order.createFromCart(req.session.user.user_id, cart, shipping, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Failed to place order');
            }
            req.session.cart = [];
            res.redirect(`/order-summary/${result.orderId}`);
        });
    },

    history: (req, res) => {
        Order.getByUser(req.session.user.user_id, (err, orders) => {
            if (err) return res.status(500).send('Failed to load orders');
            res.json(orders);
        });
    },

    summaryByOrderId: (req, res) => {
        const orderId = req.params.id;
        Order.getWithItems(orderId, (err, data) => {
            if (err) return res.status(500).send('Failed to load order summary');
            if (!data || !data.order) return res.status(404).send('Order not found');
            if (data.order.user_id !== req.session.user.user_id) {
                return res.status(403).send('Forbidden');
            }

            const totals = data.items.reduce(
                (acc, item) => {
                    acc.items += item.quantity;
                    acc.total += Number(item.price) * item.quantity;
                    return acc;
                },
                { items: 0, total: 0 }
            );

            res.render('order-summary', {
                order: data.order,
                items: data.items,
                totals: { items: totals.items, total: Number(data.order.total) || totals.total },
                user: req.session.user
            });
        });
    }
};

module.exports = OrderController;
