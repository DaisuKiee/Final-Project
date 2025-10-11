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
      <h1>Booking Submitted!</h1>
      <p>Reference: ${options.reference}</p>
      <p>Package: ${options.package}</p>
      <p>Check-in: ${new Date(options.checkin).toLocaleDateString()}</p>
      <p>Check-out: ${new Date(options.checkout).toLocaleDateString()}</p>
      <p>Total: ₱${options.totalAmount.toLocaleString()}</p>
      <p>Status: ${options.status}</p>
      <p>We will review and confirm your booking soon.</p>
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