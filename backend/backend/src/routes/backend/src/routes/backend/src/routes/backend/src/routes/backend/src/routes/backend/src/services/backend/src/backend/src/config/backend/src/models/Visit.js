const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visitDate: {
    type: Date,
    required: [true, 'Please select a visit date']
  },
  visitTime: {
    type: String,
    required: [true, 'Please select a visit time']
  },
  numberOfVisitors: {
    type: Number,
    required: [true, 'Please specify number of visitors'],
    min: 1,
    max: 10
  },
  purpose: {
    type: String,
    enum: ['tour', 'purchase', 'consultation', 'inspection', 'other'],
    default: 'tour'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  confirmationSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for querying by date
visitSchema.index({ visitDate: 1 });

// Static method to check availability
visitSchema.statics.checkAvailability = async function(date) {
  const maxVisitors = parseInt(process.env.MAX_VISITORS_PER_DAY) || 20;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const visits = await this.find({
    visitDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] }
  });

  const totalVisitors = visits.reduce((sum, visit) => sum + visit.numberOfVisitors, 0);
  return {
    available: totalVisitors < maxVisitors,
    spotsLeft: maxVisitors - totalVisitors,
    totalVisitors
  };
};

module.exports = mongoose.model('Visit', visitSchema);