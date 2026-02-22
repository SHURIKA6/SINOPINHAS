import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_ORIGIN = 'https://backend.fernandoriaddasilvaribeiro.workers.dev';

const normalizeApiBaseUrl = (rawUrl) => {
    const base = (rawUrl || DEFAULT_API_ORIGIN).trim().replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
};

const API_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
let storiesEndpointAvailable = true;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Origin': 'https://sinopinhas.vercel.app',
    }
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {
        console.log('Error reading token', e);
    }
    return config;
});

// Response interceptor to debug errors
api.interceptors.response.use(
    response => response,
    error => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const expectedStories404 = status === 404 && url.includes('/stories');
        const expectedSession401 = status === 401 && url.includes('/me');

        if (!expectedStories404 && !expectedSession401) {
            console.log('API Error:', error.response?.data || error.message);
        }
        return Promise.reject(error);
    }
);

export const loginUser = async (username, password) => {
    const { data } = await api.post('/login', { username, password });
    if (data.token) {
        await SecureStore.setItemAsync('token', data.token);
    }
    return data;
};

export const registerUser = async (username, password) => {
    const { data } = await api.post('/register', { username, password });
    if (data.token) {
        await SecureStore.setItemAsync('token', data.token);
    }
    return data;
};

export const checkSession = async () => {
    try {
        const { data } = await api.get('/me');
        return data?.user ?? data;
    } catch (e) {
        await SecureStore.deleteItemAsync('token');
        throw e;
    }
};

export const logoutUser = async () => {
    try {
        await api.post('/logout');
    } catch (e) {
        console.log('Error logging out', e);
    } finally {
        await SecureStore.deleteItemAsync('token');
    }
};

export const fetchVideos = async (page = 1, limit = 10) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const offset = (safePage - 1) * safeLimit;

    const { data } = await api.get(`/videos?limit=${safeLimit}&offset=${offset}`);
    return data;
};

export const fetchStories = async () => {
    if (!storiesEndpointAvailable) {
        return [];
    }

    try {
        const { data } = await api.get('/stories');
        return data;
    } catch (e) {
        if (e?.response?.status === 404) {
            storiesEndpointAvailable = false;
            return [];
        }
        throw e;
    }
};

export const viewStory = async (storyId) => {
    if (!storiesEndpointAvailable) {
        return { success: false, unavailable: true };
    }

    try {
        const { data } = await api.post(`/stories/${storyId}/view`);
        return data;
    } catch (e) {
        if (e?.response?.status === 404) {
            storiesEndpointAvailable = false;
            return { success: false, unavailable: true };
        }
        throw e;
    }
};

export const uploadVideo = async (videoUri, caption) => {
    const media = typeof videoUri === 'string' ? { uri: videoUri, type: 'video/mp4', name: 'video.mp4' } : (videoUri || {});
    const detectedType = media?.mimeType || media?.type || 'video/mp4';
    const mediaType = detectedType === 'video'
        ? 'video/mp4'
        : detectedType === 'image'
            ? 'image/jpeg'
            : detectedType;
    const uploadType = mediaType.startsWith('image/') ? 'photo' : 'video';
    const fileName = media?.fileName || media?.name || `${uploadType}.${uploadType === 'photo' ? 'jpg' : 'mp4'}`;

    const formData = new FormData();
    formData.append('file', {
        uri: media.uri,
        type: mediaType,
        name: fileName,
    });
    formData.append('title', caption || 'Sem titulo');
    formData.append('description', caption || '');
    formData.append('type', uploadType);

    const { data } = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const uploadStory = async (formData) => {
    if (!storiesEndpointAvailable) {
        throw new Error('Stories endpoint not available');
    }

    const { data } = await api.post('/stories', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const likeVideo = async (videoId) => {
    const { data } = await api.post(`/videos/${videoId}/like`);
    return data;
};

export const commentVideo = async (videoId, comment) => {
    const { data } = await api.post('/comment', { video_id: videoId, comment });
    return data;
};

export const searchVideos = async (query, page = 1) => {
    const safeQuery = encodeURIComponent(query || '');
    const { data } = await api.get(`/videos/search?q=${safeQuery}`);
    return data;
};

export default api;
