const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  experience: { type: String, required: true },
  languages: { type: String, required: true },
  certifications: String,
  availability: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'application' // Fix: Matches your singular DB collection
});

module.exports = mongoose.model('TourGuideApplication', applicationSchema);