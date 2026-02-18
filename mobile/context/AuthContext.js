import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { loginUser, registerUser, checkSession, logoutUser } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await checkSession();
            setUser(userData);
        } catch (e) {
            console.log('Error loading user', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (username, password) => {
        try {
            const data = await loginUser(username, password);
            setUser(data.user);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || 'Erro ao entrar' };
        }
    };

    const signUp = async (username, password) => {
        try {
            const data = await registerUser(username, password);
            setUser(data.user);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || 'Erro ao registrar' };
        }
    };

    const signOut = async () => {
        try {
            await logoutUser();
            setUser(null);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
