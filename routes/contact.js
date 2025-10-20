const express = require('express');
const { sendEmailNotification } = require('../utils/notifications');
const router = express.Router();

// Contact Form Submission
router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Send notification to admin/support email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    await sendEmailNotification(adminEmail, {
      subject: `Contact Form: ${subject}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Reply to: ${email}</em></p>
      `
    });

    // Send confirmation email to the user
    await sendEmailNotification(email, {
      subject: 'We received your message - Daanbantayan Paradise',
      html: `
        <h1>Thank you for contacting us!</h1>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <h3>Your Message:</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>Best regards,<br>Daanbantayan Paradise Team</p>
        <p><strong>Contact Information:</strong><br>
        Address: Brgy. Agujo, Daanbantayan, Cebu, Philippines<br>
        Phone: +639945935023<br>
        Email: info@daanbantayanparadise.com</p>
      `
    });

    res.json({ message: 'Message sent successfully! Check your email for confirmation.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again or contact us directly at info@daanbantayanparadise.com' 
    });
  }
});

module.exports = router;