const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const promoteUserToAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            return;
        }

        // Update user role to admin
        user.role = 'admin';
        await user.save({ validateBeforeSave: false });

        console.log(`User ${user.name} (${user.email}) promoted to admin successfully`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error promoting user to admin:', error);
    }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
    console.log('Usage: node promoteAdmin.js <email>');
    console.log('Example: node promoteAdmin.js admin@example.com');
    process.exit(1);
}

promoteUserToAdmin(email);
