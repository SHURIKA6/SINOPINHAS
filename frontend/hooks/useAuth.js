import { useState, useEffect, useRef } from 'react';
import { fetchPublicProfile, logTermsAcceptance, fetchNotifications, savePushSubscription, sendFingerprint } from '../services/api';

export function useAuth(showToast) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [adminPassword, setAdminPassword] = useState('');
    const prevUnreadRef = useRef(0);

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

                    // Refresh Profile (to get latest achievements/stats)
                    try {
                        const res = await fetchPublicProfile(u.id);
                        if (res.data) {
                            const updated = { ...u, ...res.data };
                            setUser(updated);
                            localStorage.setItem('user', JSON.stringify(updated));
                        }
                    } catch (refreshErr) {
                        console.error("Failed to refresh profile", refreshErr);
                    }
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
        localStorage.removeItem('token'); // Clear token to prevent auto-restore
        showToast('Saiu do modo admin', 'success');
    };

    const subscribeToNotifications = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            showToast('Navegador não suporta notificações', 'error');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Tenta obter subscrição existente
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Se não houver, pede permissão e cria
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    // ESTA CHAVE DEVE SER GERADA (VAPID PUBLIC KEY)
                    // Exemplo: npx web-push generate-vapid-keys
                    applicationServerKey: 'BM0Z72h-hiwvQg9kWtYpxsYYQncXlyVpEuxpZBrQdlZIkL8_9p-9NltrTH0Uy2GtBaWNoDwLq-gS8xsiVQIO_wA'
                });
            }

            const deviceInfo = await sendFingerprint('PUSH_SUBSCRIBE');
            await savePushSubscription(subscription, deviceInfo);

            showToast('Notificações ativadas!', 'success');
            return subscription;
        } catch (err) {
            console.error('Push error:', err);
            showToast('Sem permissão para notificações', 'error');
        }
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
        loadNotifications,
        setUser,
        subscribeToNotifications
    };
}
