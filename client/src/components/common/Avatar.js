import React from 'react';

const Avatar = ({
    src,
    alt,
    size = 'medium',
    className = '',
    onClick = null,
    ...props
}) => {
    const defaultAvatar = `${window.location.origin}/images/default-avatar.svg`;

    const handleError = (e) => {
        e.target.src = defaultAvatar;
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small':
                return 'avatar-small';
            case 'large':
                return 'avatar-large';
            case 'xl':
                return 'avatar-xl';
            default:
                return 'avatar-medium';
        }
    };

    return (
        <div className={`avatar ${getSizeClass()} ${className}`} onClick={onClick}>
            <img
                src={src || defaultAvatar}
                alt={alt || 'User Avatar'}
                onError={handleError}
                {...props}
            />
        </div>
    );
};

export default Avatar;
