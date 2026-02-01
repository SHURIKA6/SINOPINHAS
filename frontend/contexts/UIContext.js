import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const UIContext = createContext();

export function UIProvider({ children }) {
    const router = useRouter();
    const [activeTab, setActiveTabState] = useState('feed');
    const [theme, setTheme] = useState('dark');
    const [showProfile, setShowProfile] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showSecretTab, setShowSecretTab] = useState(false);
    const [toast, setToast] = useState(null);
    const [publicProfileId, setPublicProfileId] = useState(null);
    const [achievementToList, setAchievementToList] = useState(null);
    const [zoomedPhoto, setZoomedPhoto] = useState(null);

    // Initial Theme Load
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const showToastFn = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        router.push({
            pathname: '/',
            query: { ...router.query, tab: tab }
        }, undefined, { shallow: true });
    };

    // Sync with URL
    useEffect(() => {
        if (router.isReady) {
            const tab = router.query.tab;
            if (tab && ['feed', 'upload', 'eventos', 'news', 'lugares', 'weather', 'admin', 'inbox', 'secret'].includes(tab)) {
                setActiveTabState(tab);
            }
        }
    }, [router.isReady, router.query.tab]);


    return (
        <UIContext.Provider value={{
            activeTab, setActiveTab,
            theme, toggleTheme,
            showProfile, setShowProfile,
            showSupport, setShowSupport,
            showSecretTab, setShowSecretTab,
            toast, showToast: showToastFn, setToast,
            publicProfileId, setPublicProfileId,
            achievementToList, setAchievementToList,
            zoomedPhoto, setZoomedPhoto
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUIContext() {
    return useContext(UIContext);
}
