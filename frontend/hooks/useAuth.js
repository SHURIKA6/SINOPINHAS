import { useState, useEffect, useRef } from 'react';
import { logTermsAcceptance, fetchNotifications } from '../services/api';

export function useAuth(showToast) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [adminPassword, setAdminPassword] = useState('');
    const prevUnreadRef = useRef(0);

    // Initial check
    useEffect(() => {
        const checkAuth = async () => {
            // Admin Auth restoration
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.role === 'admin') {
                        setIsAdmin(true);
                    }
                } catch (e) {
                    console.error("Failed to parse token for admin check", e);
                }
            }

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
        };

        checkAuth();
    }, []);

    // Polling para Notificações (Simulação de Real-time)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            loadNotifications(user.id);
        }, 15000); // 15 segundos é um bom equilíbrio

        return () => clearInterval(interval);
    }, [user?.id]);

    const loadNotifications = async (userId) => {
        try {
            const data = await fetchNotifications(userId);
            const unread = data.filter(n => !n.is_read).length;

            if (unread > prevUnreadRef.current) {
                showToast(`Você tem ${unread} novas mensagens!`, 'success');
                // Play sound? Maybe too much, just toast.
            }

            setUnreadCount(unread);
            prevUnreadRef.current = unread;
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
        setAdminPassword(password);
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
        setAdminPassword('');
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
        adminPassword,
        unreadCount,
        handleAuthSuccess,
        handleAdminAuthSuccess,
        logout,
        logoutAdmin,
        loadNotifications // Exporting this so components can refresh counters
    };
}
