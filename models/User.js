const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'tourguide'], default: 'user' },
  phone: { type: String },
  isVerified: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  suspendedAt: { type: Date },
  suspendedReason: { type: String },
  verificationToken: { type: String },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  activeBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  // Profile fields
  languages: { type: String },
  experience: { type: String },
  bio: { type: String },
  profilePicture: { type: String } // Base64 encoded image
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);