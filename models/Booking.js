const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedGuide: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Key for tour guide queries
  package: { type: String, required: true },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  guests: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'active', 'completed', 'rejected', 'declined'], default: 'pending' },
  reference: { type: String, unique: true },
  governmentId: String,
  idNumber: String,
  contactNumber: String,
  paymentMethod: String,
  specialRequests: String,
  rating: { type: Number, min: 1, max: 5 },
  ratingComment: String,
  commission: { type: Number, default: 0 }, // Tour guide commission
  tip: { type: Number, default: 0 }, // Tourist tip
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'booking' // Fix: Matches your singular DB collection
});

// Auto-generate reference if missing
bookingSchema.pre('save', function(next) {
  if (this.reference) return next();
  this.reference = `DB${Date.now()}`;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);