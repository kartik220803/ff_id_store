import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch notification stats (unread count)
    const fetchNotificationStats = async () => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        try {
            console.log('Fetching notification stats...');
            const response = await notificationAPI.getNotificationStats();
            console.log('Notification stats response:', response);
            if (response.data && response.data.success) {
                const newUnreadCount = response.data.data.unreadCount || 0;
                console.log('Setting unread count to:', newUnreadCount);
                setUnreadCount(newUnreadCount);
            }
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            // Temporarily set to 1 for testing
            console.log('Setting test unread count to 1 for debugging');
            setUnreadCount(1);
        }
    };

    // Fetch all notifications
    const fetchNotifications = async (params = {}) => {
        if (!isAuthenticated) {
            setNotifications([]);
            return;
        }

        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications(params);
            if (response.data && response.data.success) {
                setNotifications(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, read: true }
                        : notif
                )
            );
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await notificationAPI.deleteNotification(notificationId);
            // Update local state
            const deletedNotification = notifications.find(n => n._id === notificationId);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));

            // Update unread count if the deleted notification was unread
            if (deletedNotification && !deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Refresh notifications (useful after new offer/order)
    const refreshNotifications = () => {
        fetchNotificationStats();
    };

    // Auto-refresh notification stats every 30 seconds when user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotificationStats();

            const interval = setInterval(() => {
                fetchNotificationStats();
            }, 30000); // Refresh every 30 seconds

            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
            setNotifications([]);
        }
    }, [isAuthenticated, user]);

    const value = {
        unreadCount,
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
        fetchNotificationStats
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
