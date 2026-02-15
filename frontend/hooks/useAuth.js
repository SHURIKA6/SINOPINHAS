import { useState, useEffect, useRef } from 'react';
import { fetchPublicProfile, logTermsAcceptance, fetchNotifications, savePushSubscription, sendFingerprint, checkSession, logoutUser as apiLogout } from '../services/api';

export function useAuth(showToast) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [adminPassword, setAdminPassword] = useState('');
    const prevUnreadRef = useRef(0);

    // Verificação Inicial
    useEffect(() => {
        const checkAuth = async () => {
            // Tentar verificar sessão via cookie primeiro
            try {
                const sessionData = await checkSession();
                if (sessionData?.user) {
                    setUser(sessionData.user);
                    localStorage.setItem('user', JSON.stringify(sessionData.user));
                    loadNotifications(sessionData.user.id);
                    return;
                }
            } catch (e) {
                // Cookie inválido ou expirado, tentar fallback localStorage
            }

            // Fallback: Autenticação via localStorage
            const savedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (savedUser && token) {
                try {
                    const u = JSON.parse(savedUser);
                    setUser(u);
                    loadNotifications(u.id);

                    // Atualizar Perfil
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
            } else {
                if (savedUser) localStorage.removeItem('user');
            }
        };

        checkAuth();
    }, []);

    // Sincronizar isAdmin com o cargo do usuário
    useEffect(() => {
        if (user?.role === 'admin') {
            setIsAdmin(true);
        } else if (!adminPassword) {
            // Se não logou manualmente com senha mestre, e não é role admin, reseta
            setIsAdmin(false);
        }
    }, [user?.role, adminPassword]);

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
            setNotifications(data);
            const unread = data.filter(n => !n.is_read).length;

            if (unread > prevUnreadRef.current) {
                showToast(`Você tem ${unread} novas mensagens!`, 'success');
            }

            setUnreadCount(unread);
            prevUnreadRef.current = unread;
        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
            if (err.status === 401 || err.response?.status === 401) {
                logout();
            }
        }
    };

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        if (userData.role === 'admin') setIsAdmin(true);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.id) loadNotifications(userData.id);
        showToast(`Bem-vindo, ${userData.username}!`, 'success');
    };

    const handleAdminAuthSuccess = (password) => {
        // Nós NÃO salvamos mais a senha no localStorage.
        setIsAdmin(true);
        setAdminPassword(password);
        // Token já salvo por api.loginAdmin
        showToast('Modo Admin Ativado', 'success');
    };

    const logout = async () => {
        try {
            await apiLogout(); // Limpa cookie HttpOnly no backend
        } catch (e) {
            // Ignora erro se o backend não responder
        }
        setUser(null);
        setIsAdmin(false);
        setAdminPassword('');
        setNotifications([]);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUnreadCount(0);
        showToast('Logout realizado', 'success');
    };

    const logoutAdmin = () => {
        setIsAdmin(false);
        setAdminPassword('');
        logout(); // Também limpa o usuário para evitar chamadas sem token
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
        notifications,
        handleAuthSuccess,
        handleAdminAuthSuccess,
        logout,
        logoutAdmin,
        loadNotifications,
        setUser,
        subscribeToNotifications
    };
}
