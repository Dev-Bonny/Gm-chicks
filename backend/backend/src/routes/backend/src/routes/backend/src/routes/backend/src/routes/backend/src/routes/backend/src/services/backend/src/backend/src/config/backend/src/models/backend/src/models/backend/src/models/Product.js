const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  category: {
    type: String,
    required: [true, 'Please specify category'],
    enum: ['chick', 'layer', 'broiler']
  },
  age: {
    type: String,
    required: true
  },
  ageInDays: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 0,
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  breed: {
    type: String,
    required: true
  },
  weight: {
    type: String // e.g., "1.5kg" for mature chickens
  },
  features: [String], // e.g., ["High egg production", "Disease resistant"]
  isAvailable: {
    type: Boolean,
    default: true
  },
  sold: {
    type: Number,
    default: 0
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);