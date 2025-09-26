const generateDefaultAvatar = (userName, userId) => {
    // Generate a default avatar URL based on user info
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // Create variety based on user info
    const avatarTypes = [
        'default-avatar.svg',           // Gaming controller
        'default-avatar-headset.svg',   // Gaming headset
        'default-avatar-trophy.svg',    // Gaming trophy
    ];

    // Use userId or userName to determine which avatar to use
    let index = 0;
    if (userId) {
        // Use the last character of the userId to determine avatar
        const lastChar = userId.toString().slice(-1);
        index = parseInt(lastChar, 16) % avatarTypes.length;
    } else if (userName) {
        // Use userName length to determine avatar
        index = userName.length % avatarTypes.length;
    }

    return `${baseUrl}/images/${avatarTypes[index]}`;
};

const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
        return generateDefaultAvatar();
    }

    // If avatar is already a full URL (Cloudinary URL), return as is
    if (avatarPath.startsWith('http')) {
        return avatarPath;
    }

    // If it's a relative path, construct full URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return `${baseUrl}/images/${avatarPath}`;
};

module.exports = {
    generateDefaultAvatar,
    getAvatarUrl,
};
