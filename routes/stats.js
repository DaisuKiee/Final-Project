const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const TourGuideApplication = require('../models/TourGuideApplication');

// Get platform statistics
router.get('/', async (req, res) => {
    try {
        // Count total users (tourists)
        const totalTourists = await User.countDocuments({ role: 'user' });
        
        // Count total bookings
        const totalBookings = await Booking.countDocuments();
        
        // Count approved tour guides
        const totalGuides = await TourGuideApplication.countDocuments({ status: 'approved' });
        
        // Calculate average rating from bookings (if rating field exists)
        const bookingsWithRatings = await Booking.find({ rating: { $exists: true, $ne: null } });
        let averageRating = 4.9; // Default
        if (bookingsWithRatings.length > 0) {
            const totalRating = bookingsWithRatings.reduce((sum, booking) => sum + (booking.rating || 0), 0);
            averageRating = (totalRating / bookingsWithRatings.length).toFixed(1);
        }
        
        // Tourist spots count (static for now, can be made dynamic)
        const touristSpots = 15;
        
        res.json({
            success: true,
            stats: {
                touristSpots,
                totalTourists,
                averageRating: parseFloat(averageRating),
                totalGuides,
                totalBookings
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            stats: {
                touristSpots: 15,
                totalTourists: 500,
                averageRating: 4.9,
                totalGuides: 20,
                totalBookings: 0
            }
        });
    }
});

module.exports = router;
