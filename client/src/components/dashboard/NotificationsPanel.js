import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationsPanel = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' or 'unread'
    const [stats, setStats] = useState({ totalUnread: 0 });

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const unreadOnly = filter === 'unread';
            const response = await api.get(`/notifications?unreadOnly=${unreadOnly}`);
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const fetchNotificationStats = useCallback(async () => {
        try {
            const response = await api.get('/notifications/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching notification stats:', error);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchNotificationStats();
        }
    }, [user, fetchNotifications, fetchNotificationStats]);

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, isRead: true, readAt: new Date() }
                        : notif
                )
            );
            fetchNotificationStats(); // Refresh stats
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
            );
            fetchNotificationStats(); // Refresh stats
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            fetchNotificationStats(); // Refresh stats
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const iconMap = {
            offer_received: 'fa-handshake',
            offer_accepted: 'fa-check-circle',
            offer_rejected: 'fa-times-circle',
            offer_expired: 'fa-clock',
            purchase_request: 'fa-shopping-cart',
            purchase_accepted: 'fa-check-circle',
            purchase_rejected: 'fa-times-circle',
            purchase_made: 'fa-shopping-cart',
            account_sold: 'fa-money-bill-wave',
            payment_received: 'fa-credit-card',
            account_delivered: 'fa-box',
            general: 'fa-bell'
        };
        return iconMap[type] || 'fa-bell';
    };

    const getNotificationColor = (type) => {
        const colorMap = {
            offer_received: 'info',
            offer_accepted: 'success',
            offer_rejected: 'danger',
            offer_expired: 'warning',
            purchase_request: 'danger',
            purchase_accepted: 'success',
            purchase_rejected: 'danger',
            purchase_made: 'success',
            account_sold: 'success',
            payment_received: 'success',
            account_delivered: 'primary',
            general: 'info'
        };
        return colorMap[type] || 'info';
    };

    const formatRelativeTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="notifications-panel">
                <div className="loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-panel">
            <div className="notifications-header">
                <div className="notifications-title">
                    <h3>
                        <i className="fas fa-bell"></i>
                        Notifications
                        {stats.totalUnread > 0 && (
                            <span className="unread-badge">{stats.totalUnread}</span>
                        )}
                    </h3>
                </div>

                <div className="notifications-actions">
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({stats.totalUnread})
                        </button>
                    </div>

                    {stats.totalUnread > 0 && (
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={markAllAsRead}
                        >
                            Mark All Read
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="no-notifications">
                        <i className="fas fa-bell-slash"></i>
                        <p>
                            {filter === 'unread'
                                ? 'No unread notifications'
                                : 'No notifications yet'
                            }
                        </p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        >
                            <div className="notification-content">
                                <div className="notification-icon">
                                    <i className={`fas ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`}></i>
                                </div>

                                <div className="notification-body">
                                    <div className="notification-title">
                                        {notification.title}
                                        {!notification.isRead && <span className="unread-dot"></span>}
                                    </div>
                                    <div className="notification-message">
                                        {notification.message}
                                    </div>
                                    <div className="notification-meta">
                                        <span className="notification-time">
                                            {formatRelativeTime(notification.createdAt)}
                                        </span>
                                        {notification.relatedProduct && (
                                            <span className="notification-product">
                                                <i className="fas fa-gamepad"></i>
                                                {notification.relatedProduct.title}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="notification-actions">
                                {!notification.isRead && (
                                    <button
                                        className="notification-action-btn"
                                        onClick={() => markAsRead(notification._id)}
                                        title="Mark as read"
                                    >
                                        <i className="fas fa-check"></i>
                                    </button>
                                )}
                                <button
                                    className="notification-action-btn delete"
                                    onClick={() => deleteNotification(notification._id)}
                                    title="Delete notification"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
