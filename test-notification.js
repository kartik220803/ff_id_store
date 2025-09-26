// Test script to check notification creation
const mongoose = require('mongoose');
const Notification = require('./server/models/Notification');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

async function testNotificationCreation() {
    try {
        console.log('Testing notification creation...');

        // Create a test notification
        const testNotification = await Notification.create({
            user: new mongoose.Types.ObjectId(),
            type: 'general',
            title: 'Test Notification',
            message: 'This is a test notification to check if notifications are working.',
            isRead: false
        });

        console.log('Test notification created successfully:', testNotification);

        // List all notifications
        const allNotifications = await Notification.find({}).limit(5);
        console.log('Recent notifications:', allNotifications);

        // Clean up test notification
        await Notification.findByIdAndDelete(testNotification._id);
        console.log('Test notification cleaned up');

        process.exit(0);
    } catch (error) {
        console.error('Error testing notifications:', error);
        process.exit(1);
    }
}

testNotificationCreation();
