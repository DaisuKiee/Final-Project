const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/authenticate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/chat';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images and common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and documents allowed.'));
        }
    }
});

// Send text message
router.post('/send', authenticate, async (req, res) => {
    try {
        const { bookingId, message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        // Get current user
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Verify booking exists
        const booking = await Booking.findById(bookingId).populate('user assignedGuide');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Check if chat is allowed (booking must be approved or active)
        if (!['approved', 'active'].includes(booking.status)) {
            return res.status(403).json({ error: 'Chat not available for this booking status' });
        }
        
        // Verify user is either the tourist or assigned guide
        const isParticipant = booking.user._id.toString() === req.userId.toString() ||
                             booking.assignedGuide?._id.toString() === req.userId.toString();
        
        if (!isParticipant) {
            return res.status(403).json({ error: 'Not authorized to chat in this booking' });
        }
        
        // Create message
        const newMessage = new Message({
            bookingId,
            senderId: req.userId,
            senderRole: currentUser.role,
            message: message.trim(),
            messageType: 'text'
        });
        
        await newMessage.save();
        await newMessage.populate('senderId', 'name role profilePicture');
        
        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Send file/image
router.post('/send-file', authenticate, upload.single('file'), async (req, res) => {
    try {
        const { bookingId, message } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Get current user
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Verify booking exists
        const booking = await Booking.findById(bookingId).populate('user assignedGuide');
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Check if chat is allowed
        if (!['approved', 'active'].includes(booking.status)) {
            return res.status(403).json({ error: 'Chat not available for this booking status' });
        }
        
        // Verify user is participant
        const isParticipant = booking.user._id.toString() === req.userId.toString() ||
                             booking.assignedGuide?._id.toString() === req.userId.toString();
        
        if (!isParticipant) {
            return res.status(403).json({ error: 'Not authorized to chat in this booking' });
        }
        
        // Determine message type
        const isImage = /image/.test(req.file.mimetype);
        
        // Create message with attachment
        const newMessage = new Message({
            bookingId,
            senderId: req.userId,
            senderRole: currentUser.role,
            message: message || (isImage ? '📷 Image' : '📎 File'),
            messageType: isImage ? 'image' : 'file',
            attachment: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: `/uploads/chat/${req.file.filename}`
            }
        });
        
        await newMessage.save();
        await newMessage.populate('senderId', 'name role profilePicture');
        
        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error('Send file error:', error);
        res.status(500).json({ error: 'Failed to send file' });
    }
});

// Get messages for a booking
router.get('/messages/:bookingId', authenticate, async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Get current user
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Verify booking and authorization
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const isParticipant = booking.user.toString() === req.userId.toString() ||
                             booking.assignedGuide?.toString() === req.userId.toString();
        
        // Allow admin to view completed booking conversations
        const isAdminViewingCompleted = currentUser.role === 'admin' && booking.status === 'completed';
        
        if (!isParticipant && !isAdminViewingCompleted) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        // Get messages (last 100) with sender info including profile picture
        const messages = await Message.find({ bookingId })
            .sort({ timestamp: 1 })
            .limit(100)
            .populate('senderId', 'name role profilePicture')
            .lean();
        
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to load messages' });
    }
});

// Mark messages as read
router.put('/mark-read/:bookingId', authenticate, async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Mark all unread messages from other user as read
        await Message.updateMany(
            {
                bookingId,
                senderId: { $ne: req.userId },
                read: false
            },
            { read: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Get unread message count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        // Get all bookings where user is participant
        const bookings = await Booking.find({
            $or: [
                { user: req.userId },
                { assignedGuide: req.userId }
            ],
            status: { $in: ['approved', 'active'] }
        }).select('_id');
        
        const bookingIds = bookings.map(b => b._id);
        
        // Count unread messages
        const count = await Message.countDocuments({
            bookingId: { $in: bookingIds },
            senderId: { $ne: req.userId },
            read: false
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Get tour guide info for a booking
router.get('/guide-info/:bookingId', authenticate, async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Get current user
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Verify booking and authorization
        const booking = await Booking.findById(bookingId)
            .populate('assignedGuide', 'name email phone')
            .populate('user', '_id');
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Allow tourist or admin to view guide info
        const isTourist = booking.user._id.toString() === req.userId.toString();
        const isAdmin = currentUser.role === 'admin';
        
        if (!isTourist && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        if (!booking.assignedGuide) {
            return res.status(404).json({ error: 'No guide assigned yet' });
        }
        
        // Get guide's application details
        const TourGuideApplication = require('../models/TourGuideApplication');
        const guideApplication = await TourGuideApplication.findOne({ 
            user: booking.assignedGuide._id,
            status: 'approved'
        });
        
        const guideInfo = {
            name: booking.assignedGuide.name,
            email: booking.assignedGuide.email,
            phone: booking.assignedGuide.phone || guideApplication?.phone,
            address: guideApplication?.address,
            experience: guideApplication?.experience,
            languages: guideApplication?.languages,
            certifications: guideApplication?.certifications,
            availability: guideApplication?.availability
        };
        
        res.json(guideInfo);
    } catch (error) {
        console.error('Get guide info error:', error);
        res.status(500).json({ error: 'Failed to get guide information' });
    }
});

// Get all completed bookings with chat history (Admin only)
router.get('/admin/completed-chats', authenticate, async (req, res) => {
    try {
        // Get current user
        const User = require('../models/User');
        const currentUser = await User.findById(req.userId);
        
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // Get all completed bookings with chat messages
        const completedBookings = await Booking.find({ status: 'completed' })
            .populate('user', 'name email')
            .populate('assignedGuide', 'name email')
            .sort({ updatedAt: -1 })
            .lean();
        
        // Get message count for each booking
        const bookingsWithChatInfo = await Promise.all(
            completedBookings.map(async (booking) => {
                const messageCount = await Message.countDocuments({ bookingId: booking._id });
                const lastMessage = await Message.findOne({ bookingId: booking._id })
                    .sort({ timestamp: -1 })
                    .select('message timestamp')
                    .lean();
                
                return {
                    ...booking,
                    messageCount,
                    lastMessage: lastMessage ? {
                        text: lastMessage.message,
                        timestamp: lastMessage.timestamp
                    } : null
                };
            })
        );
        
        res.json(bookingsWithChatInfo);
    } catch (error) {
        console.error('Get completed chats error:', error);
        res.status(500).json({ error: 'Failed to load completed chats' });
    }
});

module.exports = router;
