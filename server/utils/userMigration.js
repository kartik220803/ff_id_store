const User = require('../models/User');

/**
 * Update existing users without createdAt timestamp
 * This should be run once to fix existing data
 */
const updateUsersWithoutCreatedAt = async () => {
    try {
        console.log('Checking for users without createdAt timestamp...');

        // Find users without createdAt or with invalid dates
        const usersWithoutDate = await User.find({
            $or: [
                { createdAt: { $exists: false } },
                { createdAt: null },
                { createdAt: '' }
            ]
        });

        if (usersWithoutDate.length === 0) {
            console.log('All users have valid createdAt timestamps.');
            return;
        }

        console.log(`Found ${usersWithoutDate.length} users without createdAt. Updating...`);

        // Update each user with current timestamp
        const updates = usersWithoutDate.map(user => {
            return User.findByIdAndUpdate(
                user._id,
                { createdAt: new Date() },
                { new: true }
            );
        });

        await Promise.all(updates);

        console.log(`Successfully updated ${usersWithoutDate.length} users with createdAt timestamps.`);
    } catch (error) {
        console.error('Error updating users with createdAt:', error);
    }
};

module.exports = {
    updateUsersWithoutCreatedAt,
};
