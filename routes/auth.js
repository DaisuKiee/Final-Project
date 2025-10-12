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
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome to Daanbantayan Paradise!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background: #007bbf; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you did not sign up, please ignore this email.</p>
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
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your Daanbantayan Paradise account. Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #007bbf; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset link sent to your email. Please wait for 1-2 minutes' });
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


module.exports = router;
