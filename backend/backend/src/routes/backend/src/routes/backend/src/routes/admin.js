const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Visit = require('../models/Visit');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// All routes are protected and admin only
router.use(protect, admin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      totalUsers,
      pendingVisits
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ paymentStatus: 'completed' }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.countDocuments(),
      Product.countDocuments({ quantity: { $lt: 10 } }),
      User.countDocuments({ role: 'customer' }),
      Visit.countDocuments({ status: 'pending' })
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      statistics: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
        lowStockProducts,
        totalUsers,
        pendingVisits
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated to ${status} by admin`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/visits
// @desc    Get all visits
// @access  Private/Admin
router.get('/visits', async (req, res) => {
  try {
    const { status, date } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.visitDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const visits = await Visit.find(query)
      .populate('user', 'name email phone')
      .sort({ visitDate: 1 });

    res.json({
      success: true,
      count: visits.length,
      visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/visits/:id/status
// @desc    Update visit status
// @access  Private/Admin
router.put('/visits/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.json({
      success: true,
      message: 'Visit status updated',
      visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/products/low-stock
// @desc    Get low stock products
// @access  Private/Admin
router.get('/products/low-stock', async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    
    const products = await Product.find({
      quantity: { $lt: Number(threshold) }
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/sales-report
// @desc    Get sales report
// @access  Private/Admin
router.get('/sales-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = { paymentStatus: 'completed' };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const salesByCategory = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const totalSales = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      report: {
        totalRevenue: totalSales[0]?.total || 0,
        totalOrders: totalSales[0]?.count || 0,
        salesByCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;