import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { socialAPI } from '../../services/api';

const SocialActions = ({ product, onUpdate }) => {
    const { user, isAuthenticated } = useAuth();

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        if (product) {
            setLikesCount(product.socialStats?.likesCount || product.likes?.length || 0);
            setViewsCount(product.socialStats?.viewsCount || product.views || 0);
            setCommentsCount(product.socialStats?.commentsCount || product.commentsCount || 0);
            setLiked(product.socialStats?.isLiked || false);

            // Record view when component mounts
            recordView();
        }
    }, [product]);

    const recordView = async () => {
        try {
            if (product && product._id) {
                await socialAPI.viewProduct(product._id);
                // Optionally update local view count
                setViewsCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error recording view:', error);
        }
    };

    const handleLike = async () => {
        if (!user) {
            alert('Please log in to like this product');
            return;
        }

        if (liking) return;

        try {
            setLiking(true);
            const response = await socialAPI.likeProduct(product._id);

            const newLiked = response.data.liked;
            const newLikesCount = response.data.likesCount;

            setLiked(newLiked);
            setLikesCount(newLikesCount);

            // Update parent component if callback provided
            if (onUpdate) {
                onUpdate({
                    ...product,
                    socialStats: {
                        ...product.socialStats,
                        isLiked: newLiked,
                        likesCount: newLikesCount,
                    }
                });
            }
        } catch (error) {
            console.error('Error liking product:', error);
            alert('Failed to like product');
        } finally {
            setLiking(false);
        }
    };

    return (
        <div className="social-actions">
            <button
                className={`social-btn ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={liking}
                title={liked ? 'Unlike this account' : 'Like this account'}
            >
                <i className="fas fa-heart"></i>
                <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <div className="social-btn" style={{ cursor: 'default', opacity: 0.8 }} title={`${viewsCount} views`}>
                <i className="fas fa-eye"></i>
                <span>{viewsCount} {viewsCount === 1 ? 'View' : 'Views'}</span>
            </div>

            <div className="social-btn" style={{ cursor: 'default', opacity: 0.8 }} title={`${commentsCount} comments`}>
                <i className="fas fa-comment"></i>
                <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
            </div>
        </div>
    );
};

export default SocialActions;
