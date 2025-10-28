const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/visits
// @desc    Schedule farm visit
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { visitDate, visitTime, numberOfVisitors, purpose, notes } = req.body;

    // Check availability
    const availability = await Visit.checkAvailability(visitDate);
    
    if (!availability.available || availability.spotsLeft < numberOfVisitors) {
      return res.status(400).json({
        success: false,
        message: `Sorry, only ${availability.spotsLeft} spots available on this date`
      });
    }

    // Create visit
    const visit = await Visit.create({
      user: req.user._id,
      visitDate,
      visitTime,
      numberOfVisitors,
      purpose,
      notes
    });

    // TODO: Send confirmation email/SMS

    res.status(201).json({
      success: true,
      message: 'Visit scheduled successfully',
      visit
    });
  } catch (error) {
    console.error('Schedule visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/visits
// @desc    Get user visits
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const visits = await Visit.find({ user: req.user._id })
      .sort({ visitDate: -1 });

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

// @route   GET /api/visits/availability/:date
// @desc    Check availability for a date
// @access  Public
router.get('/availability/:date', async (req, res) => {
  try {
    const availability = await Visit.checkAvailability(req.params.date);

    res.json({
      success: true,
      ...availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/visits/:id/cancel
// @desc    Cancel visit
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (visit.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    visit.status = 'cancelled';
    await visit.save();

    res.json({
      success: true,
      message: 'Visit cancelled successfully',
      visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;