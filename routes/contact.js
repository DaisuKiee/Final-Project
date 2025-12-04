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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        📬 New Contact Form Submission
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Alert Badge -->
                  <tr>
                    <td style="padding: 25px 30px 15px 30px;">
                      <div style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 8px 20px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        🔔 Action Required
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Sender Info -->
                  <tr>
                    <td style="padding: 0 30px 20px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              Sender Information
                            </h3>
                            
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">
                                  👤 Name:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                                  ${name}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📧 Email:
                                </td>
                                <td style="padding: 8px 0;">
                                  <a href="mailto:${email}" style="color: #3b82f6; font-size: 14px; font-weight: 600; text-decoration: none;">
                                    ${email}
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📝 Subject:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                                  ${subject}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  🕐 Received:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                                  ${new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Message Content -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        💬 Message
                      </h3>
                      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px;">
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
                          ${message.replace(/\n/g, '<br>')}
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Quick Reply Button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                        📧 Reply to ${name}
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        This is an automated notification from your contact form
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

    // Send confirmation email to the user
    await sendEmailNotification(email, {
      subject: 'We received your message - Daanbantayan Paradise',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        🏝️ Daanbantayan Paradise
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Your Gateway to Paradise</p>
                    </td>
                  </tr>
                  
                  <!-- Success Badge -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                        ✓ Message Received
                      </div>
                      <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Thank You for Contacting Us!
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        Dear ${name}, we've received your message and will respond within 24 hours.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Message Summary -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                              📋 Your Message Summary
                            </h3>
                            
                            <div style="margin-bottom: 15px;">
                              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                Subject
                              </p>
                              <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">
                                ${subject}
                              </p>
                            </div>
                            
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                                Message
                              </p>
                              <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
                                ${message.replace(/\n/g, '<br>')}
                              </p>
                            </div>
                            
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                🕐 Sent on ${new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- What's Next -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                          ⏱️ What Happens Next?
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                          <li>Our team will review your message</li>
                          <li>We'll respond within 24 hours</li>
                          <li>Check your inbox (and spam folder) for our reply</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Contact Information -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 8px; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="margin: 0 0 12px 0; color: #78350f; font-size: 15px; font-weight: 600;">
                              📞 Need Immediate Assistance?
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 5px 0; color: #92400e; font-size: 13px;">
                                  📍 Address:
                                </td>
                                <td style="padding: 5px 0; color: #78350f; font-size: 13px; font-weight: 600;">
                                  Brgy. Agujo, Daanbantayan, Cebu, Philippines
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 5px 0; color: #92400e; font-size: 13px;">
                                  📱 Phone:
                                </td>
                                <td style="padding: 5px 0;">
                                  <a href="tel:+639945935023" style="color: #78350f; font-size: 13px; font-weight: 600; text-decoration: none;">
                                    +639945935023
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 5px 0; color: #92400e; font-size: 13px;">
                                  📧 Email:
                                </td>
                                <td style="padding: 5px 0;">
                                  <a href="mailto:info@daanbantayanparadise.com" style="color: #78350f; font-size: 13px; font-weight: 600; text-decoration: none;">
                                    info@daanbantayanparadise.com
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Signature -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <p style="margin: 0 0 5px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                        Best regards,
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
                        This is an automated confirmation. Please do not reply to this email.
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

    res.json({ message: 'Message sent successfully! Check your email for confirmation.' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again or contact us directly at info@daanbantayanparadise.com' 
    });
  }
});

module.exports = router;