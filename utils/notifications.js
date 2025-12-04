const nodemailer = require('nodemailer');
const twilio = require('twilio');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// async function testEmail() {
//   try {
//     await transporter.verify();
//     console.log('SMTP connection verified');
//     const info = await transporter.sendMail({
//       from: `"Test Sender" <${process.env.EMAIL_USER}>`,
//       to: 'warszkie34@gmail.com', // Replace with your email
//       subject: 'Test Email',
//       text: 'This is a test email from Daanbantayan Paradise.',
//     });
//     console.log('Test email sent:', info.messageId);
//   } catch (error) {
//     console.error('Test email error:', {
//       message: error.message,
//       code: error.code,
//       command: error.command,
//       stack: error.stack,
//     });
//   }
// }

// testEmail();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendEmailNotification(email, options) {
  // Validate email
  if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    console.error('Invalid email address in sendEmailNotification:', email);
    throw new Error('Invalid email address');
  }

  // Ensure mailOptions has required fields
  const mailOptions = typeof options === 'object' && options.subject && options.html ? {
    from: `"Daanbantayan Paradise" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: options.subject,
    html: options.html
  } : {
    from: `"Daanbantayan Paradise" <${process.env.EMAIL_USER}>`,
    to: email.trim(),
    subject: `Booking Confirmation - ${options.reference}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
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
                      ✓ Booking Submitted Successfully
                    </div>
                    <h2 style="margin: 20px 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                      Thank You for Your Booking!
                    </h2>
                    <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                      We've received your booking request and will review it shortly.
                    </p>
                  </td>
                </tr>
                
                <!-- Booking Details -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="padding: 20px;">
                          
                          <!-- Reference Number -->
                          <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                              Reference Number
                            </p>
                            <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace;">
                              ${options.reference}
                            </p>
                          </div>
                          
                          <!-- Package -->
                          <div style="margin-bottom: 15px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                                  📦 Package:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${options.package}
                                </td>
                              </tr>
                              
                              <!-- Check-in -->
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📅 Check-in:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${new Date(options.checkin).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                              
                              <!-- Check-out -->
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📅 Check-out:
                                </td>
                                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                  ${new Date(options.checkout).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                              </tr>
                              
                              <!-- Status -->
                              <tr>
                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                  📊 Status:
                                </td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize;">
                                    ${options.status}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </div>
                          
                          <!-- Total Amount -->
                          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                              Total Amount
                            </p>
                            <p style="margin: 0; color: #667eea; font-size: 32px; font-weight: 700;">
                              ₱${options.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Next Steps -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                      <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                        📋 What's Next?
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                        <li>Our team will review your booking request</li>
                        <li>You'll receive a confirmation email within 24 hours</li>
                        <li>Payment instructions will be sent upon approval</li>
                        <li>Keep your reference number for future inquiries</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                
                <!-- Contact Info -->
                <tr>
                  <td style="padding: 0 30px 30px 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      Need help? Contact us anytime
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
                      This is an automated message. Please do not reply to this email.
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
  };

  try {
    console.log('Preparing to send email with options:', { to: mailOptions.to, subject: mailOptions.subject });
    await transporter.verify(); // Verify SMTP connection
    console.log('SMTP connection verified');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('Email notification error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    throw new Error(`Failed to send email notification: ${error.message}`);
  }
}

async function sendSMSNotification(phone, booking) {
  if (!phone) {
    console.log('No phone number provided for SMS');
    return;
  }
  try {
    await client.messages.create({
      body: `Booking ${booking.reference} submitted! Package: ${booking.package}. Total: ₱${booking.totalAmount}. Status: ${booking.status}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    console.log('SMS sent to', phone);
  } catch (error) {
    console.error('SMS notification error:', error);
    // Do not throw error to ensure email notification proceeds
  }
}

module.exports = { sendEmailNotification, sendSMSNotification };