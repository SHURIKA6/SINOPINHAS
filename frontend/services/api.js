import axios from 'axios';
import { getDeviceFingerprint } from '../lib/fingerprint';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';

const api = axios.create({
    baseURL: API
});

// Interceptador para adicionar Token JWT na requisição
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Interceptador para tratamento global de respostas e erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Extrai mensagem de erro padronizada do backend
        const backendError = error.response?.data?.error;
        console.error("🔥 Backend Error Details:", error.response?.data);
        let customMessage = error.response?.data?.message || backendError;

        // Cria um erro novo com a mensagem limpa para o frontend exibir
        const customError = new Error(customMessage || "Ocorreu um erro inesperado.");
        customError.originalError = error;
        customError.status = error.response?.status;

        // Se for erro de autorização (401/403) e não for na tela de login, pode redirecionar se quiser
        if (error.response?.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
            // Opcional: window.location.href = '/?login=true';
        }

        // Detecção de falhas críticas ou erros de CORS/Banco
        // Só substitui se o backend não enviou um erro tratado
        if (backendError) {
            // Se for erro interno, mostra mensagem genérica
            if (backendError === 'INTERNAL_ERROR') {
                customMessage = "O servidor encontrou um erro interno. Tente novamente mais tarde.";
            }
            // Caso contrário, tenta manter a mensagem descritiva que já veio do backend
        }

        // Erros de Rede ou Crash do Servidor
        if ((error.message === 'Network Error' || (error.message && error.message.includes('NetworkError'))) && !backendError) {
            customError.message = "Erro de Conexão: O servidor não respondeu (Verifique DATABASE_URL).";
        } else if (error.response?.status === 500 && !backendError) {
            customError.message = "Erro Interno: Falha crítica no servidor.";
        } else {
            const details = error.response?.data?.details;
            customError.message = customMessage || error.message;
            if (details) {
                customError.message += ` (${details})`;
            }
        }

        return Promise.reject(customError);
    }
);

export const sendFingerprint = async (action, metadata = {}) => {
    try {
        const deviceFingerprint = await getDeviceFingerprint();

        const fingerprintHash = typeof deviceFingerprint.hash === 'string'
            ? deviceFingerprint.hash
            : (typeof deviceFingerprint.secondaryHash === 'string'
                ? deviceFingerprint.secondaryHash
                : 'unknown');

        return {
            ...metadata,
            ...deviceFingerprint,
            fingerprint: fingerprintHash,
            action: action
        };
    } catch (err) {
        console.error('Erro ao capturar fingerprint:', err);
        return {
            ...metadata,
            fingerprint: navigator.userAgent || 'unknown',
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            action: action
        };
    }
};

export const logTermsAcceptance = async (userId) => {
    const fingerprintData = await sendFingerprint('TERMS_ACCEPTED', { userId });
    return api.post('/api/log-terms', fingerprintData);
};

export const fetchNotifications = async (userId) => {
    const res = await api.get(`/api/notifications/${userId}`);
    return res.data;
};

export const fetchVideos = async (userId = null, limit = 12, offset = 0, type = null) => {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (type) params.set('type', type);
    params.set('limit', limit);
    params.set('offset', offset);
    const res = await api.get(`/api/videos?${params.toString()}`);
    return res.data;
};

export const fetchSecretVideos = async (userId = null, limit = 12, offset = 0, type = null) => {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (type) params.set('type', type);
    params.set('limit', limit);
    params.set('offset', offset);
    const res = await api.get(`/api/secret-videos?${params.toString()}`);
    return res.data;
};

export const searchVideos = async (query) => {
    const res = await api.get(`/api/videos/search?q=${encodeURIComponent(query)}`);
    return res.data;
};

export const likeVideo = (videoId, userId) => {
    return api.post(`/api/videos/${videoId}/like`, { user_id: userId });
};

export const updateUserProfile = (userId, updates) => {
    // Se for FormData, o axios cuida do Content-Type automaticamente
    return api.put(`/api/users/${userId}`, updates);
};

// --- News ---
export const fetchNews = () => api.get('/api/news').then(res => res.data);

// --- Events ---
export const fetchEvents = () => api.get('/api/local-agenda').then(res => res.data);

// --- Places ---
export const fetchPlaces = () => api.get('/api/local-guide').then(res => res.data);

// --- Comments ---
export const fetchComments = async (videoId) => {
    const res = await api.get(`/api/comments/${videoId}`);
    return res.data;
};

export const viewVideo = (videoId, userId) => {
    return api.post(`/api/videos/${videoId}/view`, { user_id: userId });
};

export const postComment = (videoId, userId, comment) => {
    return api.post(`/api/comment`, {
        video_id: videoId,
        user_id: userId,
        comment
    });
};

export const deleteComment = (commentId, userId, adminPassword = null) => {
    return api.delete(`/api/comments/${commentId}`, {
        data: { user_id: userId, admin_password: adminPassword }
    });
};

export const fetchUsers = async () => {
    const res = await api.get(`/api/admin/users`);
    return res.data;
};

export const fetchLogs = async () => {
    const res = await api.get(`/api/admin/logs`);
    return res.data;
};

export const resetUserPassword = (userId, adminPassword) => {
    return api.post(`/api/admin/reset-password`, { user_id: userId, admin_password: adminPassword });
};

export const banUser = (userId, adminPassword) => {
    return api.delete(`/api/admin/users/${userId}`, { data: { admin_password: adminPassword } });
};

export const loginUser = async (username, password) => {
    const fingerprintData = await sendFingerprint('USER_LOGIN', {
        username,
        auth_type: 'login',
    });
    const res = await api.post('/api/login', { username, password, ...fingerprintData });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
    }
    return res.data;
};

export const registerUser = async (username, password) => {
    const fingerprintData = await sendFingerprint('USER_REGISTER', {
        username,
        auth_type: 'register',
    });
    const res = await api.post('/api/register', { username, password, ...fingerprintData });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
    }
    return res.data;
};

export const loginAdmin = async (password) => {
    const res = await api.post('/api/admin/login', { password });
    if (res.data.token) {
        localStorage.setItem('token', res.data.token);
    }
    return res.data;
};

export const uploadVideo = (formData, onUploadProgress) => {
    return api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
    });
};

export const removeVideo = (videoId, userId, adminPassword = null) => {
    // Send both fields. Backend checks adminPassword first, then uses userId for ownership check if not admin.
    const deleteData = { userId, adminPassword };
    return api.delete(`/api/videos/${videoId}`, { data: deleteData });
};

export const savePushSubscription = (subscription, deviceInfo) => {
    return api.post('/api/push/subscribe', { subscription, deviceInfo });
};

export const removePushSubscription = (subscription) => {
    return api.post('/api/push/unsubscribe', { subscription });
};

export default api;
