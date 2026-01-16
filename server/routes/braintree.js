const express = require("express");
const router = express.Router();
const brainTreeController = require("../controller/braintree");

// FIX: Changed "ganerateToken" to "generateToken"
router.post("/braintree/get-token", brainTreeController.generateToken);
router.post("/braintree/payment", brainTreeController.paymentProcess);

module.exports = router;
