import axios from 'axios';
import { getDeviceFingerprint } from '../lib/fingerprint';

const API = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API
});

// Interceptador para tratamento global de erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Extrai a mensagem de erro bonita do backend (se existir)
        const backendError = error.response?.data?.error;
        const cleanMessage = backendError || "Ocorreu um erro inesperado. Tente novamente.";

        // Cria um erro novo com a mensagem limpa para o frontend exibir
        const customError = new Error(cleanMessage);
        customError.originalError = error;
        customError.status = error.response?.status;

        // Se for erro de autorização (401/403) e não for na tela de login, pode redirecionar se quiser
        if (error.response?.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
            // Opcional: window.location.href = '/?login=true';
        }

        // DETECT HARD CRASH OR CORS ERROR (Usually DB connection failure)
        if (error.message === 'Network Error' || (error.response?.status === 500 && !backendError)) {
            customError.message = "Erro de Conexão: Verifique 'DATABASE_URL' no Cloudflare.";
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

export const fetchVideos = async (userId = null) => {
    const query = userId ? `?user_id=${userId}` : '';
    const res = await api.get(`/api/videos${query}`);
    return res.data;
};

export const fetchSecretVideos = async (userId = null) => {
    const query = userId ? `?user_id=${userId}` : '';
    const res = await api.get(`/api/secret-videos${query}`);
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
    return api.put(`/api/users/${userId}`, updates);
};

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

export const fetchUsers = async (adminPassword) => {
    const res = await api.get(`/api/admin/users?admin_password=${adminPassword}`);
    return res.data;
};

export const fetchLogs = async (adminPassword) => {
    const res = await api.get(`/api/admin/logs?admin_password=${adminPassword}`);
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
    return res.data;
};

export const registerUser = async (username, password) => {
    const fingerprintData = await sendFingerprint('USER_REGISTER', {
        username,
        auth_type: 'register',
    });
    const res = await api.post('/api/register', { username, password, ...fingerprintData });
    return res.data;
};

export const loginAdmin = async (password) => {
    const res = await api.post('/api/admin/login', { password });
    return res.data;
};

export const uploadVideo = (formData, onUploadProgress) => {
    return api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
    });
};

export const removeVideo = (videoId, userId, adminPassword = null) => {
    const deleteData = adminPassword ? { adminPassword } : { userId };
    return api.delete(`/api/videos/${videoId}`, { data: deleteData });
};

export default api;
