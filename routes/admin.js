const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const TourGuideApplication = require('../models/TourGuideApplication');
const { authenticate, isAdmin } = require('../middleware/authenticate');

// Admin routes - protected by authentication and admin role check

// Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Get all bookings
router.get('/bookings', authenticate, isAdmin, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('user', 'name email');
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
    }
});

// Get dashboard statistics
router.get('/dashboard-stats', authenticate, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalBookings = await Booking.countDocuments();
        const totalGuides = await TourGuideApplication.countDocuments({ status: 'approved' });
        const pendingApplications = await TourGuideApplication.countDocuments({ status: 'pending' });
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalBookings,
                totalGuides,
                pendingApplications
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
});

// Update user
router.put('/users/:userId', authenticate, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, phone, role } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (role) user.role = role;

        await user.save();

        res.json({ success: true, message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:userId', authenticate, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, error: 'Cannot delete admin users' });
        }

        await User.findByIdAndDelete(userId);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

// Suspend user
router.put('/users/:userId/suspend', authenticate, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prevent suspending admin users
        if (user.role === 'admin') {
            return res.status(403).json({ success: false, error: 'Cannot suspend admin users' });
        }

        user.suspended = true;
        user.suspensionReason = reason || 'No reason provided';
        user.suspendedAt = new Date();

        await user.save();

        res.json({ success: true, message: 'User suspended successfully', user });
    } catch (error) {
        console.error('Error suspending user:', error);
        res.status(500).json({ success: false, error: 'Failed to suspend user' });
    }
});

// Unsuspend user
router.put('/users/:userId/unsuspend', authenticate, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.suspended = false;
        user.suspensionReason = null;
        user.suspendedAt = null;

        await user.save();

        res.json({ success: true, message: 'User unsuspended successfully', user });
    } catch (error) {
        console.error('Error unsuspending user:', error);
        res.status(500).json({ success: false, error: 'Failed to unsuspend user' });
    }
});

module.exports = router;
