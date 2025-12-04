const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmailNotification } = require('../utils/notifications');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Invalid email provided:', email);
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ name, email, password, phone, verificationToken });
    await user.save();

    console.log('User created, sending verification email to:', email);

    const verificationLink = `${process.env.BASE_URL}/verify/${verificationToken}`;
    await sendEmailNotification(email, {
      subject: 'Verify Your Email - Daanbantayan Paradise',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 60px; margin-bottom: 10px;">🏝️</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Welcome to Daanbantayan Paradise!
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Your Gateway to Paradise Awaits</p>
                    </td>
                  </tr>
                  
                  <!-- Welcome Message -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Just One More Step!
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        Hi ${name}! Thank you for registering. Please verify your email address to activate your account and start exploring paradise.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Verification Button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        ✓ Verify Email Address
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Alternative Link -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all; text-align: center;">
                          ${verificationLink}
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- What's Next -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                          🎯 After Verification
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                          <li>Access your personalized dashboard</li>
                          <li>Browse and book amazing tour packages</li>
                          <li>Connect with professional tour guides</li>
                          <li>Explore the beauty of Daanbantayan</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Security Notice -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px;">
                        <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.6;">
                          🔒 <strong>Security Notice:</strong> If you didn't create an account with Daanbantayan Paradise, please ignore this email. Your email address will not be used.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Daanbantayan Paradise. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Brgy. Agujo, Daanbantayan, Cebu, Philippines
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

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account. Please wait for 1-2 minutes' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Verify Email
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Include role in token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }
    // Include role in token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    await sendEmailNotification(email, {
      subject: 'Password Reset Request - Daanbantayan Paradise',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 60px; margin-bottom: 10px;">🔐</div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                        Password Reset Request
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px;">Secure your account</p>
                    </td>
                  </tr>
                  
                  <!-- Message -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px; text-align: center;">
                      <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                        Reset Your Password
                      </h2>
                      <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                        We received a request to reset your password for your Daanbantayan Paradise account. Click the button below to create a new password.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Reset Button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                        🔑 Reset Password
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Alternative Link -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                          If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all; text-align: center;">
                          ${resetLink}
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Expiry Notice -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 8px 0; color: #78350f; font-size: 16px; font-weight: 600;">
                          ⏰ Time Sensitive
                        </h3>
                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.7;">
                          This password reset link will expire in <strong>1 hour</strong> for security reasons. If you need a new link, you can request another password reset.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Security Notice -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px;">
                        <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                          🔒 Security Notice
                        </h3>
                        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.7;">
                          If you didn't request a password reset, please ignore this email. Your password will remain unchanged. Consider changing your password if you suspect unauthorized access to your account.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Support -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                        Need help? Contact our support team
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
                        This is an automated security email
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

    res.json({ message: 'Password reset link sent to your email, Please wait for 1-2 minutes' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: error.message || 'Failed to send reset link' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message || 'Failed to reset password' });
  }
});

// Get Current User
const { authenticate } = require('../middleware/authenticate');
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        languages: user.languages,
        experience: user.experience,
        bio: user.bio,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, languages, experience, bio, profilePicture } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (languages !== undefined) user.languages = languages;
    if (experience !== undefined) user.experience = experience;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        languages: user.languages,
        experience: user.experience,
        bio: user.bio,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});

module.exports = router;