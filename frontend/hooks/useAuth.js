import { useState, useEffect } from 'react';
import { logTermsAcceptance, fetchNotifications } from '../services/api';

export function useAuth(showToast) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial check
    useEffect(() => {
        const checkAuth = async () => {
            // User Auth
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const u = JSON.parse(savedUser);
                    setUser(u);
                    loadNotifications(u.id);
                } catch (e) {
                    console.error("Failed to parse user", e);
                    logout();
                }
            }

            // Admin Auth
            // We NO LONGER store adminPassword in localStorage for security.
            // We rely on the JWT token 'role'.
            // However, to keep UI consistent, we might store a flag like 'isAdminMode'
            // or just decode the token if possible. For now, simple state.
        };

        checkAuth();
    }, []);

    const loadNotifications = async (userId) => {
        try {
            const data = await fetchNotifications(userId);
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
        }
    };

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.id) loadNotifications(userData.id);
        showToast(`Bem-vindo, ${userData.username}!`, 'success');
    };

    const handleAdminAuthSuccess = (password) => {
        // We do NOT save password to localStorage anymore.
        setIsAdmin(true);
        // Token is already saved by api.loginAdmin
        showToast('Modo Admin Ativado', 'success');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Clear token on full logout
        setUnreadCount(0);
        showToast('Logout realizado', 'success');
    };

    const logoutAdmin = () => {
        setIsAdmin(false);
        // If we strictly rely on one token, logoutAdmin implies reverting to a User Token?
        // Or just stripping Admin privileges valid for UI?
        // Ideally, we should re-login as user if they were user.
        // For simplicity:
        showToast('Saiu do modo admin', 'success');
        // Note: Real security depends on the backend verification of the token.
    };

    return {
        user,
        isAdmin,
        unreadCount,
        handleAuthSuccess,
        handleAdminAuthSuccess,
        logout,
        logoutAdmin
    };
}
