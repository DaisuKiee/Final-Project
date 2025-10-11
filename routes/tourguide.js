const express = require('express');
const TourGuideApplication = require('../models/TourGuideApplication');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmailNotification } = require('../utils/notifications');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Apply as Tour Guide (unchanged)
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { address, experience, languages, certifications, availability, name, phone } = req.body;
    const application = new TourGuideApplication({
      user: req.userId,
      name,
      phone,
      address,
      experience,
      languages,
      certifications,
      availability
    });
    await application.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all applications (admin only) - unchanged
router.get('/applications', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const applications = await TourGuideApplication.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Approve/Reject Application - unchanged
router.put('/applications/:id/approve', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const application = await TourGuideApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.status = 'approved';
    await application.save();

    const applicantUser = await User.findById(application.user);
    applicantUser.role = 'tourguide';
    await applicantUser.save();

    await sendEmailNotification(applicantUser.email, {
      subject: 'Tour Guide Application Approved',
      html: `
        <h1>Congratulations!</h1>
        <p>Your application to become a tour guide has been approved. You can now log in to your dashboard.</p>
      `
    });

    res.json({ message: 'Application approved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/applications/:id/reject', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const application = await TourGuideApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.status = 'rejected';
    await application.save();

    const applicantUser = await User.findById(application.user);
    await sendEmailNotification(applicantUser.email, {
      subject: 'Tour Guide Application Rejected',
      html: `
        <h1>Application Update</h1>
        <p>Unfortunately, your application to become a tour guide has been rejected. Please contact support for more details.</p>
      `
    });

    res.json({ message: 'Application rejected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Tour Guide Bookings - UPDATED: Fetch assigned + all pending (opportunities)
router.get('/bookings', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'tourguide') return res.status(403).json({ error: 'Tour guide access required' });

    // Fetch assigned bookings (accepted by this guide)
    const assignedBookings = await Booking.find({ assignedGuide: req.userId })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Fetch all pending bookings (opportunities for any available guide)
    const pendingBookings = await Booking.find({ 
      status: 'pending', 
      assignedGuide: null // Not yet assigned
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    // Combine and categorize
    const allBookings = {
      assigned: assignedBookings,
      pending: pendingBookings
    };

    console.log(`Tour guide ${req.userId}: Assigned=${assignedBookings.length}, Pending=${pendingBookings.length}`); // Debug log

    res.json({ bookings: allBookings });
  } catch (error) {
    console.error('Tour guide bookings error:', error); // Debug
    res.status(400).json({ error: error.message });
  }
});

// Accept Booking - unchanged, but ensure it sets assignedGuide
router.put('/bookings/:id/accept', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'tourguide') return res.status(403).json({ error: 'Tour guide access required' });
    if (user.activeBooking) return res.status(400).json({ error: 'You can only have one active booking at a time' });

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'pending') return res.status(400).json({ error: 'Invalid booking' });

    booking.status = 'active';
    booking.assignedGuide = req.userId; // Ensure this sets correctly
    await booking.save();

    user.activeBooking = booking._id;
    await user.save();

    await sendEmailNotification(user.email, {
      subject: 'New Booking Accepted',
      html: `
        <h1>Booking Details</h1>
        <p>Package: ${booking.package}</p>
        <p>Check-in: ${new Date(booking.checkin).toLocaleDateString()}</p>
        <p>Check-out: ${new Date(booking.checkout).toLocaleDateString()}</p>
      `
    });

    res.json({ message: 'Booking accepted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Decline Booking - unchanged
router.put('/bookings/:id/decline', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'tourguide') return res.status(403).json({ error: 'Tour guide access required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'pending') return res.status(400).json({ error: 'Invalid booking' });

    booking.status = 'declined';
    await booking.save();

    res.json({ message: 'Booking declined' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete Booking - unchanged
router.put('/bookings/:id/complete', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'tourguide') return res.status(403).json({ error: 'Tour guide access required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'active' || booking.assignedGuide.toString() !== req.userId.toString()) return res.status(400).json({ error: 'Invalid booking' });

    booking.status = 'completed';
    await booking.save();

    user.activeBooking = null;
    await user.save();

    res.json({ message: 'Booking completed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;