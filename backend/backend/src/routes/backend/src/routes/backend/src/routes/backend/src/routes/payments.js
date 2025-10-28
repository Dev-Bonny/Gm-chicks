const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const mpesaService = require('../services/mpesa');
const { protect } = require('../middleware/auth');

// @route   POST /api/payments/initiate
// @desc    Initiate MPesa payment
// @access  Private
router.post('/initiate', protect, async (req, res) => {
  try {
    const { orderId, phoneNumber } = req.body;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and phone number are required'
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if already paid
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    // Initiate STK push
    const result = await mpesaService.initiateSTKPush(
      phoneNumber,
      order.totalAmount,
      order.orderNumber,
      `Payment for order ${order.orderNumber}`
    );

    if (result.success) {
      // Update order with phone number
      order.phoneNumber = mpesaService.formatPhoneNumber(phoneNumber);
      await order.save();

      res.json({
        success: true,
        message: 'Payment initiated. Please check your phone.',
        checkoutRequestId: result.data.CheckoutRequestID,
        merchantRequestId: result.data.MerchantRequestID
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Payment initiation failed'
      });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/payments/callback
// @desc    MPesa callback URL
// @access  Public
router.post('/callback', async (req, res) => {
  try {
    console.log('MPesa Callback:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find order by merchant request ID or checkout request ID
    let order;
    
    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata.Item;
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

      // Find order by phone number and pending payment
      order = await Order.findOne({
        phoneNumber: mpesaService.formatPhoneNumber(phoneNumber.toString()),
        paymentStatus: 'pending'
      }).sort({ createdAt: -1 });

      if (order) {
        order.paymentStatus = 'completed';
        order.mpesaReceiptNumber = mpesaReceiptNumber;
        order.mpesaTransactionId = CheckoutRequestID;
        order.orderStatus = 'processing';
        order.statusHistory.push({
          status: 'processing',
          note: 'Payment received successfully'
        });

        // Update product quantities
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { quantity: -item.quantity, sold: item.quantity }
          });
        }

        await order.save();

        // TODO: Send confirmation email/SMS
        console.log('Order payment completed:', order.orderNumber);
      }
    } else {
      // Payment failed
      console.log('Payment failed:', ResultDesc);
      
      // Optionally update order status
      // order = await Order.findOne({ ... });
      // if (order) {
      //   order.paymentStatus = 'failed';
      //   await order.save();
      // }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// @route   POST /api/payments/query
// @desc    Query payment status
// @access  Private
router.post('/query', protect, async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Checkout Request ID is required'
      });
    }

    const result = await mpesaService.queryTransaction(checkoutRequestId);

    res.json({
      success: result.success,
      data: result.data
    });
  } catch (error) {
    console.error('Query payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;