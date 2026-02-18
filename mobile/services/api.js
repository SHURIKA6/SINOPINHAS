import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';

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
        console.log('API Error:', error.response?.data || error.message);
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
        const { data } = await api.get('/profile');
        return data;
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
    const { data } = await api.get(`/videos?page=${page}&limit=${limit}`);
    return data;
};

export const fetchStories = async () => {
    const { data } = await api.get('/stories');
    return data;
};

export const viewStory = async (storyId) => {
    const { data } = await api.post(`/stories/${storyId}/view`);
    return data;
};

export const uploadVideo = async (videoUri, caption) => {
    const formData = new FormData();
    formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
    });
    formData.append('caption', caption);

    const { data } = await api.post('/videos/upload', formData, {
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
    const { data } = await api.post(`/videos/${videoId}/comment`, { comment });
    return data;
};

export const searchVideos = async (query, page = 1) => {
    const { data } = await api.get(`/search?q=${query}&page=${page}`);
    return data;
};

export default api;
