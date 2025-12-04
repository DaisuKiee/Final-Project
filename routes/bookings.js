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
      reference: booking.reference,
      package: booking.package,
      checkin: booking.checkin,
      checkout: booking.checkout,
      totalAmount: booking.totalAmount,
      status: 'pending'
    });
    if (user.phone) {
      await sendSMSNotification(user.phone, `Your booking ${booking.reference} is pending approval.`);
    }

    // Notify available tour guides
    const tourGuides = await User.find({ role: 'tourguide', activeBooking: null });
    for (const guide of tourGuides) {
      await sendEmailNotification(guide.email, {
        subject: 'New Booking Opportunity Available',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Booking Opportunity</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 50px; margin-bottom: 10px;">🔔</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                          New Booking Opportunity!
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px;">Act fast to secure this booking</p>
                      </td>
                    </tr>
                    
                    <!-- Alert Badge -->
                    <tr>
                      <td style="padding: 30px 30px 20px 30px; text-align: center;">
                        <div style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                          🎯 Available Now
                        </div>
                        <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                          A New Tour is Waiting!
                        </h2>
                      </td>
                    </tr>
                    
                    <!-- Booking Details -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fffbeb; border-radius: 8px; overflow: hidden; border: 2px solid #fbbf24;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 15px 0; color: #78350f; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                📋 Booking Details
                              </h3>
                              
                              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 10px 0; color: #92400e; font-size: 14px; width: 40%;">
                                    📦 Package:
                                  </td>
                                  <td style="padding: 10px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${booking.package}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; color: #92400e; font-size: 14px;">
                                    📅 Check-in:
                                  </td>
                                  <td style="padding: 10px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${new Date(booking.checkin).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; color: #92400e; font-size: 14px;">
                                    📅 Check-out:
                                  </td>
                                  <td style="padding: 10px 0; color: #78350f; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${new Date(booking.checkout).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; color: #92400e; font-size: 14px;">
                                    💰 Total Amount:
                                  </td>
                                  <td style="padding: 10px 0; color: #10b981; font-size: 16px; font-weight: 700; text-align: right;">
                                    ₱${booking.totalAmount.toLocaleString()}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 0; color: #92400e; font-size: 14px;">
                                    💵 Your Commission (15%):
                                  </td>
                                  <td style="padding: 10px 0; color: #f59e0b; font-size: 18px; font-weight: 700; text-align: right;">
                                    ₱${Math.round(booking.totalAmount * 0.15).toLocaleString()}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Urgency Message -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px;">
                          <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                            ⚡ First Come, First Served
                          </h3>
                          <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.7;">
                            This booking is available to all tour guides. Log in now to accept it before someone else does!
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/tour_guide.html" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                          🎯 Accept This Booking
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                          Don't miss this opportunity! 🌴
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
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
    const bookings = await Booking.find({ user: req.userId })
      .populate('user', 'name email')
      .populate('assignedGuide', 'name email phone');
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all bookings (admin only - READ ONLY for logs)
router.get('/all', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('assignedGuide', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending bookings (tour guides can see available bookings)
router.get('/pending', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'tourguide') {
      return res.status(403).json({ error: 'Tour guide access required' });
    }
    const bookings = await Booking.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve booking (tour guide only) - MOVED FROM ADMIN TO TOUR GUIDE
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'tourguide') {
      return res.status(403).json({ error: 'Tour guide access required' });
    }
    
    // Check if tour guide already has an active booking
    if (user.activeBooking) {
      return res.status(400).json({ error: 'You already have an active booking. Complete it first.' });
    }
    
    let booking = await Booking.findById(req.params.id).populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }

    // Approve booking and assign tour guide
    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        assignedGuide: req.userId 
      },
      { new: true }
    ).populate('user', 'name email phone');
    
    // Update tour guide's active booking
    await User.findByIdAndUpdate(req.userId, { activeBooking: booking._id });

    const populatedUser = booking.user;
    if (populatedUser) {
      await sendEmailNotification(populatedUser.email, {
        subject: 'Booking Approved - Tour Guide Assigned',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Approved</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 60px; margin-bottom: 10px;">✅</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                          Booking Approved!
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Your tour guide has been assigned</p>
                      </td>
                    </tr>
                    
                    <!-- Success Message -->
                    <tr>
                      <td style="padding: 30px 30px 20px 30px; text-align: center;">
                        <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
                          ✓ Confirmed & Ready
                        </div>
                        <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                          Great News!
                        </h2>
                        <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                          A tour guide has accepted your booking. Get ready for an amazing experience!
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Booking Details -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ecfdf5; border-radius: 8px; overflow: hidden; border: 2px solid #10b981;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                📋 Your Booking Details
                              </h3>
                              
                              <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #a7f3d0;">
                                <p style="margin: 0 0 5px 0; color: #059669; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Reference Number
                                </p>
                                <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">
                                  ${booking.reference}
                                </p>
                              </div>
                              
                              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 8px 0; color: #059669; font-size: 14px; width: 40%;">
                                    📦 Package:
                                  </td>
                                  <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${booking.package}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #059669; font-size: 14px;">
                                    📅 Check-in:
                                  </td>
                                  <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${new Date(booking.checkin).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #059669; font-size: 14px;">
                                    📅 Check-out:
                                  </td>
                                  <td style="padding: 8px 0; color: #065f46; font-size: 14px; font-weight: 600; text-align: right;">
                                    ${new Date(booking.checkout).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #059669; font-size: 14px;">
                                    📊 Status:
                                  </td>
                                  <td style="padding: 8px 0; text-align: right;">
                                    <span style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                      Approved
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Next Steps -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                          <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                            📝 What's Next?
                          </h3>
                          <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                            <li>Your tour guide will contact you soon</li>
                            <li>Check your dashboard for guide details</li>
                            <li>Prepare for your amazing tour</li>
                            <li>Keep your reference number handy</li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/user_dashboard.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          📱 View in Dashboard
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                          Get ready for an unforgettable experience! 🌴
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });
      if (populatedUser.phone) {
        await sendSMSNotification(populatedUser.phone, `Your booking ${booking.reference} has been approved by a tour guide!`);
      }
    }

    res.json({ message: 'Booking approved and assigned to you', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject booking (tour guide only) - MOVED FROM ADMIN TO TOUR GUIDE
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'tourguide') {
      return res.status(403).json({ error: 'Tour guide access required' });
    }
    
    let booking = await Booking.findById(req.params.id).populate('user', 'name email phone');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('user', 'name email phone');

    const populatedUser = booking.user;
    if (populatedUser) {
      await sendEmailNotification(populatedUser.email, {
        subject: 'Booking Status Update',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Status Update</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                          🏝️ Daanbantayan Paradise
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #d1d5db; font-size: 14px;">Booking Status Update</p>
                      </td>
                    </tr>
                    
                    <!-- Status Message -->
                    <tr>
                      <td style="padding: 30px 30px 20px 30px; text-align: center;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                          Booking Status Update
                        </h2>
                        <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                          We have an update regarding your booking request
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Reference -->
                    <tr>
                      <td style="padding: 0 30px 20px 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                          <tr>
                            <td style="padding: 15px; text-align: center;">
                              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                Reference Number
                              </p>
                              <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">
                                ${booking.reference}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px;">
                          <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.7;">
                            Unfortunately, your booking could not be accommodated at this time. This may be due to availability constraints or other factors.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Options -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #eff6ff; border-radius: 8px; overflow: hidden;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                                💡 What You Can Do
                              </h3>
                              <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                                <li>Try booking different dates</li>
                                <li>Choose an alternative package</li>
                                <li>Contact our support team for assistance</li>
                                <li>Check for other available options</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- CTA Buttons -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/booking.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; margin: 0 5px 10px 5px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          🔄 Try Another Booking
                        </a>
                        <a href="mailto:${process.env.EMAIL_USER || 'support@daanbantayan.com'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; margin: 0 5px 10px 5px;">
                          📧 Contact Support
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Closing -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          We apologize for any inconvenience and hope to serve you soon.
                        </p>
                        <p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600;">
                          Daanbantayan Paradise Team
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });
      if (populatedUser.phone) {
        await sendSMSNotification(populatedUser.phone, `Booking ${booking.reference} status updated. Please check your email.`);
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
          subject: 'New Rating Received ⭐',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Rating Received</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                          <div style="font-size: 60px; margin-bottom: 10px;">⭐</div>
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                            New Rating Received!
                          </h1>
                          <p style="margin: 10px 0 0 0; color: #ede9fe; font-size: 14px;">A tourist rated your service</p>
                        </td>
                      </tr>
                      
                      <!-- Rating Display -->
                      <tr>
                        <td style="padding: 30px 30px 25px 30px; text-align: center;">
                          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.2);">
                            <p style="margin: 0 0 10px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                              Your Rating
                            </p>
                            <div style="margin: 0 0 10px 0;">
                              <span style="font-size: 48px; color: #fbbf24;">${'⭐'.repeat(rating)}</span>
                            </div>
                            <p style="margin: 0; color: #78350f; font-size: 32px; font-weight: 700;">
                              ${rating}/5
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Booking Reference -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                            <tr>
                              <td style="padding: 15px; text-align: center;">
                                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Booking Reference
                                </p>
                                <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 700; font-family: 'Courier New', monospace;">
                                  ${booking.reference}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      ${comment ? `
                      <!-- Comment -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                            <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                              💬 Tourist's Comment
                            </h3>
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.7; font-style: italic;">
                              "${comment}"
                            </p>
                          </div>
                        </td>
                      </tr>
                      ` : ''}
                      
                      <!-- Motivational Message -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                            <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                              ${rating >= 4 ? '🎉 Excellent Work!' : '💪 Keep Improving!'}
                            </h3>
                            <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.7;">
                              ${rating >= 4 
                                ? 'Your dedication to providing excellent service is paying off! Keep up the amazing work and continue to delight our tourists.' 
                                : 'Every rating is an opportunity to learn and grow. Use this feedback to enhance your service and create even better experiences.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- CTA Button -->
                      <tr>
                        <td style="padding: 0 30px 30px 30px; text-align: center;">
                          <a href="${process.env.APP_URL || 'http://localhost:3000'}/tour_guide.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                            📊 View All Ratings
                          </a>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                            © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                            Your feedback helps us grow! 🌴
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        });
      }
    }

    res.json({ message: 'Rating submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add tip to booking
router.put('/:id/tip', authenticate, async (req, res) => {
  try {
    const { tipAmount } = req.body;
    if (!tipAmount || tipAmount < 0) {
      return res.status(400).json({ error: 'Invalid tip amount' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.userId) return res.status(403).json({ error: 'You can only tip your own bookings' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only tip completed bookings' });

    booking.tip = (booking.tip || 0) + tipAmount;
    await booking.save();

    // Notify the guide
    if (booking.assignedGuide) {
      const guide = await User.findById(booking.assignedGuide);
      if (guide && guide.email) {
        await sendEmailNotification(guide.email, {
          subject: 'You Received a Tip! 💰',
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Tip Received</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
                          <div style="font-size: 70px; margin-bottom: 10px;">💰</div>
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                            You Received a Tip!
                          </h1>
                          <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px;">Your excellent service was appreciated</p>
                        </td>
                      </tr>
                      
                      <!-- Celebration -->
                      <tr>
                        <td style="padding: 30px 30px 20px 30px; text-align: center;">
                          <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
                            🎉 Great Job!
                          </div>
                          <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                            Congratulations!
                          </h2>
                          <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                            A tourist was so impressed with your service that they left you a tip!
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Tip Amount -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 35px; text-align: center; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3);">
                            <p style="margin: 0 0 8px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                              Tip Received
                            </p>
                            <p style="margin: 0; color: #78350f; font-size: 52px; font-weight: 700; line-height: 1;">
                              ₱${tipAmount.toLocaleString()}
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- Booking Details -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                            <tr>
                              <td style="padding: 20px;">
                                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                                  📋 Booking Details
                                </h3>
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 45%;">
                                      🔖 Reference:
                                    </td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; font-family: 'Courier New', monospace;">
                                      ${booking.reference}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                      💵 Total Tips:
                                    </td>
                                    <td style="padding: 8px 0; color: #10b981; font-size: 18px; font-weight: 700; text-align: right;">
                                      ₱${booking.tip.toLocaleString()}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Motivational Message -->
                      <tr>
                        <td style="padding: 0 30px 25px 30px;">
                          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                            <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                              🌟 Keep Up the Excellent Work!
                            </h3>
                            <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.7;">
                              Your dedication and excellent service are making a difference. Tips like this show that tourists truly appreciate your hard work. Keep providing amazing experiences!
                            </p>
                          </div>
                        </td>
                      </tr>
                      
                      <!-- CTA Button -->
                      <tr>
                        <td style="padding: 0 30px 30px 30px; text-align: center;">
                          <a href="${process.env.APP_URL || 'http://localhost:3000'}/tour_guide.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          📊 View Dashboard
                        </a>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                            © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                            You're making a difference! 🌴
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        });
      }
    }

    res.json({ message: 'Tip added successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;