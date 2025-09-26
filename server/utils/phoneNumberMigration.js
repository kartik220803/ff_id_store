const User = require('../models/User');

const fixInvalidPhoneNumbers = async () => {
    try {
        console.log('Starting phone number cleanup...');

        // Find users with invalid phone numbers
        const users = await User.find({
            phone: { $exists: true, $ne: null, $ne: '' }
        });

        let fixedCount = 0;

        for (const user of users) {
            // Check if phone is not exactly 10 digits
            if (user.phone && !/^\d{10}$/.test(user.phone)) {
                console.log(`Found invalid phone for user ${user.email}: ${user.phone}`);

                // Try to fix the phone number
                let fixedPhone = user.phone.replace(/\D/g, ''); // Remove non-digits

                if (fixedPhone.length > 10) {
                    // If more than 10 digits, take the last 10 (assuming country code prefix)
                    fixedPhone = fixedPhone.slice(-10);
                } else if (fixedPhone.length < 10) {
                    // If less than 10 digits, set to null (optional field)
                    fixedPhone = null;
                }

                // Validate the fixed phone
                if (fixedPhone && /^\d{10}$/.test(fixedPhone)) {
                    user.phone = fixedPhone;
                    console.log(`Fixed phone for ${user.email}: ${user.phone}`);
                } else {
                    user.phone = null;
                    console.log(`Cleared invalid phone for ${user.email}`);
                }

                await user.save({ validateBeforeSave: false });
                fixedCount++;
            }
        }

        console.log(`Phone number cleanup completed. Fixed ${fixedCount} users.`);
    } catch (error) {
        console.error('Error during phone number cleanup:', error);
    }
};

module.exports = { fixInvalidPhoneNumbers };
