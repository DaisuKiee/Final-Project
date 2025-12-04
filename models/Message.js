const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'tourguide'],
        required: true
    },
    message: {
        type: String,
        maxlength: 1000,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    attachment: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    },
    read: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
messageSchema.index({ bookingId: 1, timestamp: 1 });
messageSchema.index({ bookingId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
