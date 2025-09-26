import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commentAPI } from '../../services/api';
import Avatar from '../common/Avatar';

const Comments = ({ productId }) => {
    const { user, isAuthenticated } = useAuth();

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyText, setReplyText] = useState({});
    const [showReplyForm, setShowReplyForm] = useState({});

    useEffect(() => {
        fetchComments();
    }, [productId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await commentAPI.getComments(productId);
            setComments(response.data.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }; const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('Please log in to comment');
            return;
        }

        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            const response = await commentAPI.addComment(productId, { comment: newComment });
            setComments([response.data.data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            await commentAPI.deleteComment(commentId);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!user) {
            alert('Please log in to like comments');
            return;
        }

        try {
            const response = await commentAPI.likeComment(commentId);
            const updatedComment = response.data.data;
            setComments(comments.map(comment =>
                comment._id === commentId ? updatedComment : comment
            ));
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleReply = async (commentId) => {
        if (!user) {
            alert('Please log in to reply');
            return;
        }

        const reply = replyText[commentId];
        if (!reply?.trim()) return;

        try {
            const response = await commentAPI.replyToComment(commentId, { comment: reply });
            const updatedComment = response.data.data;
            setComments(comments.map(comment =>
                comment._id === commentId ? updatedComment : comment
            ));
            setReplyText({ ...replyText, [commentId]: '' });
            setShowReplyForm({ ...showReplyForm, [commentId]: false });
        } catch (error) {
            console.error('Error replying to comment:', error);
            alert('Failed to add reply');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    const isCommentLiked = (comment) => {
        return user && comment.likes.some(like => like.user === user.id);
    };

    if (loading) {
        return (
            <div className="comments-section">
                <div className="comments-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading comments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="comments-section">
            <div className="comments-header">
                <h3 className="comments-title">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Add Comment Form */}
            {user ? (
                <form onSubmit={handleSubmitComment} className="comment-form">
                    <textarea
                        className="comment-input"
                        placeholder="Share your thoughts about this Free Fire account..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={500}
                        disabled={submitting}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {newComment.length}/500 characters
                        </span>
                        <button
                            type="submit"
                            className="comment-submit"
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="comment-form">
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                        Please <a href="/login" style={{ color: 'var(--primary-color)' }}>log in</a> to leave a comment
                    </p>
                </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
                <div className="comments-empty">
                    <i className="fas fa-comments"></i>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="comments-list">
                    {comments.map((comment) => (
                        <div key={comment._id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-author">
                                    <Avatar
                                        user={comment.user}
                                        size="32px"
                                    />
                                    <span className="comment-author-name">{comment.user.name}</span>
                                </div>
                                <div className="comment-meta">
                                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                    {user && user.id === comment.user._id && (
                                        <button
                                            className="comment-delete-btn"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            style={{
                                                marginLeft: '1rem',
                                                background: 'none',
                                                border: 'none',
                                                color: '#ff4757',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="comment-text">{comment.comment}</p>

                            <div className="comment-actions">
                                <button
                                    className={`comment-like-btn ${isCommentLiked(comment) ? 'liked' : ''}`}
                                    onClick={() => handleLikeComment(comment._id)}
                                >
                                    <i className="fas fa-heart"></i>
                                    {comment.likes.length}
                                </button>

                                <button
                                    className="comment-reply-btn"
                                    onClick={() => setShowReplyForm({
                                        ...showReplyForm,
                                        [comment._id]: !showReplyForm[comment._id]
                                    })}
                                >
                                    <i className="fas fa-reply"></i>
                                    Reply
                                </button>
                            </div>

                            {/* Reply Form */}
                            {showReplyForm[comment._id] && user && (
                                <div style={{ marginTop: '1rem' }}>
                                    <textarea
                                        className="comment-input"
                                        placeholder="Write a reply..."
                                        value={replyText[comment._id] || ''}
                                        onChange={(e) => setReplyText({
                                            ...replyText,
                                            [comment._id]: e.target.value
                                        })}
                                        maxLength={300}
                                        style={{ minHeight: '60px' }}
                                    />
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>                        <button
                                        className="comment-submit"
                                        onClick={() => handleReply(comment._id)}
                                        disabled={!replyText[comment._id]?.trim()}
                                    >
                                        Reply
                                    </button>
                                        <button
                                            className="comment-submit cancel-btn"
                                            onClick={() => {
                                                setShowReplyForm({ ...showReplyForm, [comment._id]: false });
                                                setReplyText({ ...replyText, [comment._id]: '' });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="comment-replies">
                                    {comment.replies.map((reply, index) => (
                                        <div key={index} className="reply-item">
                                            <div className="comment-header">
                                                <div className="comment-author">
                                                    <Avatar
                                                        user={reply.user}
                                                        size="24px"
                                                    />
                                                    <span className="comment-author-name">{reply.user.name}</span>
                                                </div>
                                                <span className="comment-date">{formatDate(reply.createdAt)}</span>
                                            </div>
                                            <p className="comment-text">{reply.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comments;
