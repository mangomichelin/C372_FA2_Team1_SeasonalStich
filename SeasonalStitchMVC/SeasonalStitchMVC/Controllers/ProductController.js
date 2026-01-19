const Hoodie = require('../Models/Hoodie');

const ProductController = {
    list: (req, res) => {
        Hoodie.getAll((err, hoodies) => {
            if (err) return res.status(500).send('Error loading products');
            const decorated = (hoodies || []).map((hoodie) => ({
                ...hoodie,
                image_url: hoodie.image_url ? hoodie.image_url.replace(/^\/?images\//i, '') : '',
                lowStock: Number(hoodie.stock) <= 5
            }));
            const cartCount = (req.session.cart || []).reduce((count, item) => count + item.quantity, 0);
            res.render('index', { hoodies: decorated, user: req.session.user, cartCount });
        });
    },

    getById: (req, res) => {
        const id = req.params.id;
        Hoodie.getById(id, (err, hoodie) => {
            if (err || !hoodie) return res.status(404).send('Hoodie not found');
            const hoodieData = {
                ...hoodie,
                image_url: hoodie.image_url ? hoodie.image_url.replace(/^\/?images\//i, '') : ''
            };
            res.render('update', { hoodie: hoodieData, user: req.session.user });
        });
    },

    add: (req, res) => {
        const data = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            image_url: req.file ? req.file.filename : null,
            stock: req.body.stock,
            season: req.body.season
        };

        Hoodie.add(data, (err) => {
            if (err) return res.status(500).send('Failed to add hoodie');
            res.redirect('/');
        });
    },

    update: (req, res) => {
        const id = req.params.id;
        const data = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            image_url: req.file ? req.file.filename : req.body.currentImage,
            stock: req.body.stock,
            season: req.body.season
        };

        Hoodie.update(id, data, (err) => {
            if (err) return res.status(500).send('Update failed');
            res.redirect('/');
        });
    },

    delete: (req, res) => {
        const id = req.params.id;
        Hoodie.delete(id, (err) => {
            if (err) return res.status(500).send('Delete failed');
            res.redirect('/');
        });
    }
};

module.exports = ProductController;
