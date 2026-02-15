import { createContext, useContext, useState } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import { useUIContext } from './UIContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { showToast } = useUIContext();
    const {
        user, setUser, isAdmin, adminPassword, unreadCount, notifications,
        handleAuthSuccess, handleAdminAuthSuccess, logout,
        logoutAdmin, loadNotifications, subscribeToNotifications
    } = useAuthHook(showToast);

    const [showAuth, setShowAuth] = useState(false);
    const [showAdminAuth, setShowAdminAuth] = useState(false);
    const [showSecretAuth, setShowSecretAuth] = useState(false);

    return (
        <AuthContext.Provider value={{
            user, setUser, isAdmin, adminPassword, unreadCount, notifications,
            handleAuthSuccess, handleAdminAuthSuccess, logout,
            logoutAdmin, loadNotifications, subscribeToNotifications,
            showAuth, setShowAuth,
            showAdminAuth, setShowAdminAuth,
            showSecretAuth, setShowSecretAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    return useContext(AuthContext);
}
