// Updated routes/bookings.js
const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmailNotification, sendSMSNotification } = require('../utils/notifications');
const router = express.Router();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Create Booking
router.post('/', authenticate, async (req, res) => {
  try {
    const bookingData = { ...req.body, user: req.userId, status: 'pending' }; // Ensure status is set
    const booking = new Booking(bookingData);
    booking.reference = `DB${Date.now()}`;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate('user', 'name email phone');
    const user = populatedBooking.user;
    await sendEmailNotification(user.email, {
      subject: 'Booking Confirmation - Pending Approval',
      html: `
        <h1>Booking Created Successfully!</h1>
        <p>Reference: ${booking.reference}</p>
        <p>Package: ${booking.package}</p>
        <p>Check-in: ${new Date(booking.checkin).toLocaleDateString()}</p>
        <p>Check-out: ${new Date(booking.checkout).toLocaleDateString()}</p>
        <p>Status: Pending Admin Approval</p>
      `
    });
    if (user.phone) {
      await sendSMSNotification(user.phone, `Your booking ${booking.reference} is pending approval.`);
    }

    // Notify available tour guides
    const tourGuides = await User.find({ role: 'tourguide', activeBooking: null });
    for (const guide of tourGuides) {
      await sendEmailNotification(guide.email, {
        subject: 'New Booking Available',
        html: `
          <h1>New Booking Opportunity</h1>
          <p>Package: ${booking.package}</p>
          <p>Check-in: ${new Date(booking.checkin).toLocaleDateString()}</p>
          <p>Check-out: ${new Date(booking.checkout).toLocaleDateString()}</p>
          <p>Log in to your dashboard to accept this booking.</p>
        `
      });
    }

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get User's Bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId }).populate('user', 'name email');
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bookings (admin only)
router.get('/all', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve booking (admin only)
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    let booking = await Booking.findById(req.params.id).populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('user', 'name email phone');

    const populatedUser = booking.user;
    if (populatedUser) {
      await sendEmailNotification(populatedUser.email, {
        subject: 'Booking Approved',
        html: `
          <h1>Your Booking is Approved!</h1>
          <p>Reference: ${booking.reference}</p>
          <p>Package: ${booking.package}</p>
          <p>Check-in: ${new Date(booking.checkin).toLocaleDateString()}</p>
          <p>Check-out: ${new Date(booking.checkout).toLocaleDateString()}</p>
          <p>Status: Approved</p>
        `
      });
      if (populatedUser.phone) {
        await sendSMSNotification(populatedUser.phone, `Your booking ${booking.reference} has been approved!`);
      }
    }

    res.json({ message: 'Booking approved', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject booking (admin only)
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    let booking = await Booking.findById(req.params.id).populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('user', 'name email phone');

    const populatedUser = booking.user;
    if (populatedUser) {
      await sendEmailNotification(populatedUser.email, {
        subject: 'Booking Rejected',
        html: `
          <h1>Your Booking Could Not Be Approved</h1>
          <p>Reference: ${booking.reference}</p>
          <p>Reason: Please contact support for details.</p>
        `
      });
      if (populatedUser.phone) {
        await sendSMSNotification(populatedUser.phone, `Your booking ${booking.reference} has been rejected. Contact support.`);
      }
    }

    res.json({ message: 'Booking rejected', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.userId) return res.status(403).json({ error: 'You can only rate your own bookings' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only rate completed bookings' });
    if (booking.rating) return res.status(400).json({ error: 'Booking already rated' });

    booking.rating = rating;
    booking.ratingComment = comment;
    await booking.save();

    // Optionally notify the guide
    if (booking.assignedGuide) {
      const guide = await User.findById(booking.assignedGuide);
      if (guide && guide.email) {
        await sendEmailNotification(guide.email, {
          subject: 'New Rating Received',
          html: `
            <h1>You received a rating!</h1>
            <p>Booking: ${booking.reference}</p>
            <p>Rating: ${rating}/5</p>
            ${comment ? `<p>Comment: ${comment}</p>` : ''}
          `
        });
      }
    }

    res.json({ message: 'Rating submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;