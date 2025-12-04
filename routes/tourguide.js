const express = require('express');
const TourGuideApplication = require('../models/TourGuideApplication');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendEmailNotification } = require('../utils/notifications');
const { authenticate } = require('../middleware/authenticate');

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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Approved</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Congratulations!
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Your Application Has Been Approved</p>
                    </td>
                  </tr>
                  
                  <!-- Success Message -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
                        ✓ Application Approved
                      </div>
                      <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Welcome to the Team!
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        Your application to become a tour guide has been approved. You're now part of the Daanbantayan Paradise family!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Next Steps -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                          🚀 Getting Started
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 14px; line-height: 1.8;">
                          <li>Log in to your tour guide dashboard</li>
                          <li>Complete your profile with photos and details</li>
                          <li>Browse available booking opportunities</li>
                          <li>Accept bookings and start earning commissions</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Benefits -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                              💼 Your Benefits
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  💰 Commission Rate:
                                </td>
                                <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 700; text-align: right;">
                                  15% per booking
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  🎁 Tips:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  Keep 100% of tips
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📅 Flexibility:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  Choose your bookings
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  ⭐ Ratings:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  Build your reputation
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="${process.env.APP_URL || 'http://localhost:3000'}/tour_guide.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                        🎯 Access Your Dashboard
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Support -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                        Questions? We're here to help!
                      </p>
                      <p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600;">
                        📧 ${process.env.EMAIL_USER || 'support@daanbantayan.com'}
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Welcome to our tour guide community! 🌴
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
      subject: 'Tour Guide Application Update',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
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
                      <p style="margin: 10px 0 0 0; color: #d1d5db; font-size: 14px;">Application Status Update</p>
                    </td>
                  </tr>
                  
                  <!-- Status Badge -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 15px;">
                        Application Not Approved
                      </div>
                      <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Application Update
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        Thank you for your interest in becoming a tour guide with Daanbantayan Paradise.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Message -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px;">
                        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.7;">
                          Unfortunately, we are unable to approve your application at this time. This decision may be based on current capacity, experience requirements, or other factors.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Next Steps -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                              💡 What You Can Do
                            </h3>
                            <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                              <li>Contact our support team for detailed feedback</li>
                              <li>Gain more experience and certifications</li>
                              <li>Reapply in the future when requirements are met</li>
                              <li>Explore other opportunities with us</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Contact Support -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; text-align: center;">
                        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                          📞 Need More Information?
                        </h3>
                        <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px;">
                          Our team is happy to provide feedback and guidance
                        </p>
                        <a href="mailto:${process.env.EMAIL_USER || 'support@daanbantayan.com'}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                          📧 Contact Support
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Closing -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        We appreciate your interest and wish you the best in your future endeavors.
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Accepted</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 50px; margin-bottom: 10px;">🎯</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        New Booking Accepted!
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 14px;">You have a new tour assignment</p>
                    </td>
                  </tr>
                  
                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                        ✓ Booking Confirmed
                      </div>
                      <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 22px; font-weight: 600;">
                        Get Ready for Your Tour!
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Booking Details -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              📋 Tour Details
                            </h3>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 14px; width: 40%;">
                                  📦 Package:
                                </td>
                                <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${booking.package}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">
                                  📅 Check-in:
                                </td>
                                <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${new Date(booking.checkin).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">
                                  📅 Check-out:
                                </td>
                                <td style="padding: 10px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${new Date(booking.checkout).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">
                                  💰 Total Amount:
                                </td>
                                <td style="padding: 10px 0; color: #10b981; font-size: 16px; font-weight: 700; text-align: right;">
                                  ₱${booking.totalAmount.toLocaleString()}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">
                                  💵 Your Commission (15%):
                                </td>
                                <td style="padding: 10px 0; color: #3b82f6; font-size: 16px; font-weight: 700; text-align: right;">
                                  ₱${Math.round(booking.totalAmount * 0.15).toLocaleString()}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Preparation Tips -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 10px 0; color: #78350f; font-size: 16px; font-weight: 600;">
                          ✅ Preparation Checklist
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
                          <li>Review the tour package details</li>
                          <li>Prepare necessary equipment and materials</li>
                          <li>Check weather conditions</li>
                          <li>Contact the tourist if needed</li>
                          <li>Arrive early at the meeting point</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="${process.env.APP_URL || 'http://localhost:3000'}/tour_guide.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
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
                        Good luck with your tour! 🌴
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

// Complete Booking - with commission calculation
router.put('/bookings/:id/complete', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'tourguide') return res.status(403).json({ error: 'Tour guide access required' });

    const booking = await Booking.findById(req.params.id).populate('user', 'name email');
    if (!booking || booking.status !== 'active' || booking.assignedGuide.toString() !== req.userId.toString()) return res.status(400).json({ error: 'Invalid booking' });

    // Calculate 15% commission
    const commissionRate = 0.15;
    const commission = Math.round(booking.totalAmount * commissionRate);
    
    booking.status = 'completed';
    booking.commission = commission;
    await booking.save();

    user.activeBooking = null;
    await user.save();

    // Notify tour guide about commission
    await sendEmailNotification(user.email, {
      subject: 'Tour Completed - Commission Earned',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tour Completed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 60px; margin-bottom: 10px;">🎊</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Tour Completed!
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Congratulations on another successful tour</p>
                    </td>
                  </tr>
                  
                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                        ✓ Commission Earned
                      </div>
                      <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Great Job! 🌟
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        You've successfully completed another tour. Keep up the excellent work!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Tour Summary -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              📋 Tour Summary
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
                                  📦 Package:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${booking.package}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  💰 Total Amount:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-align: right;">
                                  ₱${booking.totalAmount.toLocaleString()}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Commission Highlight -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
                        <p style="margin: 0 0 8px 0; color: #78350f; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                          Your Commission (15%)
                        </p>
                        <p style="margin: 0; color: #78350f; font-size: 48px; font-weight: 700; line-height: 1;">
                          ₱${commission.toLocaleString()}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #92400e; font-size: 13px;">
                          💵 Plus any tips received from the tourist
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Performance Stats -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 600;">
                          🚀 Keep Growing
                        </h3>
                        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.7;">
                          Continue providing excellent service to earn more commissions and build your reputation. Tourists can now rate your service and leave tips!
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
                  
                  <!-- Motivational Message -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                        Thank you for being an amazing tour guide!
                      </p>
                      <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: 600;">
                        Daanbantayan Paradise Team 🌴
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Keep up the excellent work! 🎯
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

    // Notify tourist
    if (booking.user && booking.user.email) {
      await sendEmailNotification(booking.user.email, {
        subject: 'Tour Completed - Please Rate Your Experience',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tour Completed</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                          Tour Completed!
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Thank you for choosing Daanbantayan Paradise</p>
                      </td>
                    </tr>
                    
                    <!-- Thank You Message -->
                    <tr>
                      <td style="padding: 30px 30px 20px 30px; text-align: center;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                          We Hope You Had a Great Time!
                        </h2>
                        <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                          Your tour has been completed. We'd love to hear about your experience!
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Booking Reference -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                Booking Reference
                              </p>
                              <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">
                                ${booking.reference}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Rate & Tip Section -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; text-align: center;">
                          <h3 style="margin: 0 0 12px 0; color: #78350f; font-size: 18px; font-weight: 600;">
                            ⭐ Rate Your Experience
                          </h3>
                          <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                            Share your feedback and help us improve our service. You can also leave a tip for your tour guide!
                          </p>
                          <div style="display: inline-block; background-color: #78350f; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                            💵 Tips go 100% to your guide
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- What You Can Do -->
                    <tr>
                      <td style="padding: 0 30px 25px 30px;">
                        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                          <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                            📝 In Your Dashboard
                          </h3>
                          <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                            <li>Rate your tour guide (1-5 stars)</li>
                            <li>Leave a review and feedback</li>
                            <li>Send a tip to show appreciation</li>
                            <li>View your booking history</li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/user_dashboard.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                          ⭐ Rate & Leave a Tip
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Thank You -->
                    <tr>
                      <td style="padding: 0 30px 30px 30px; text-align: center;">
                        <p style="margin: 0 0 5px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                          Thank you for choosing us for your adventure!
                        </p>
                        <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: 600;">
                          We hope to see you again soon! 🌴
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                          © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                          Your feedback helps us serve you better
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

    res.json({ message: 'Booking completed', commission });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;