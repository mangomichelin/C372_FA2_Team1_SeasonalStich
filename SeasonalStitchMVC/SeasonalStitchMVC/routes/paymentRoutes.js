const express = require("express");
const router = express.Router();
const paymentController = require("../Controllers/paymentController");

router.post("/paypal/create-order", paymentController.createOrder);
router.post("/paypal/capture-order", paymentController.captureOrder);

module.exports = router;
    