const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment'],
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    content: {
        type: String,
        trim: true,
        maxlength: [500, 'Content cannot be more than 500 characters'],
    },
    isAdminComment: {
        type: Boolean,
        default: false,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: [300, 'Reply cannot be more than 300 characters'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field before saving
CommentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create index for efficient queries
CommentSchema.index({ product: 1, createdAt: -1 });
CommentSchema.index({ user: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
