import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, Sun, Moon, Lock, LifeBuoy,
    LogOut, User, Settings, LayoutGrid,
    Newspaper, Calendar, MapPin, CloudSun,
    MessageCircle, ShieldCheck
} from 'lucide-react';

export default function Header({
    user,
    isAdmin,
    activeTab,
    setActiveTab,
    setShowAuth,
    setShowSecretAuth,
    setShowAdminAuth,
    showSecretTab,
    unreadCount,
    setShowProfile,
    logout,
    logoutAdmin,
    theme,
    toggleTheme,
    setShowSupport
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { id: 'feed', label: 'Explorar', icon: <LayoutGrid size={20} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={20} /> },
        { id: 'eventos', label: 'Eventos', icon: <Calendar size={20} /> },
        { id: 'lugares', label: 'Lugares', icon: <MapPin size={20} /> },
        { id: 'weather', label: 'Clima', icon: <CloudSun size={20} /> },
        { id: 'inbox', label: 'Mensagens', icon: <MessageCircle size={20} />, badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Admin', icon: <Settings size={20} /> } : null,
        showSecretTab ? { id: 'secret', label: 'Secreto', icon: <Lock size={20} /> } : null
    ].filter(Boolean);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <>
            <header className="xp-header aero-glass">
                <div className="header-left">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="start-button aero-glass"
                        onClick={() => setActiveTab('feed')}
                    >
                        <img src="/icons/icon-192x192.png" alt="S" className="start-icon" onError={(e) => e.target.style.display = 'none'} />
                        <span className="start-text">Início</span>
                    </motion.div>
                    <h1 className="logo-text">SINOPINHAS</h1>
                </div>

                <div className="header-actions">
                    <div className="desktop-actions">
                        <button onClick={toggleTheme} className="xp-button icon-btn" title="Tema">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button onClick={() => setShowSecretAuth(true)} className="xp-button">
                            <Lock size={14} /> Restrito
                        </button>

                        <button onClick={() => setShowSupport(true)} className="xp-button">
                            <LifeBuoy size={14} /> Suporte
                        </button>

                        {isAdmin && (
                            <div className="admin-badge">
                                <ShieldCheck size={14} /> ADMIN
                            </div>
                        )}

                        {user ? (
                            <div className="user-section aero-glass">
                                <button onClick={() => setShowProfile(true)} className="user-btn">
                                    <img
                                        src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                                        className="user-avatar"
                                        alt={user.username}
                                    />
                                    <strong>{user.username}</strong>
                                </button>
                                <button onClick={logout} className="xp-button small-btn" title="Sair">
                                    <LogOut size={14} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="xp-button login-btn">
                                <User size={14} /> Entrar
                            </button>
                        )}

                        {!isAdmin && (
                            <button onClick={() => setShowAdminAuth(true)} className="xp-button icon-btn" title="Admin Panel">
                                <Settings size={14} />
                            </button>
                        )}
                    </div>

                    <div className="mobile-only">
                        <button onClick={toggleSidebar} className="xp-button mobile-menu-btn">
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="sidebar-overlay"
                            onClick={toggleSidebar}
                        />

                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="xp-sidebar aero-glass"
                        >
                            <div className="sidebar-header xp-title-bar">
                                <span>Menu Iniciar</span>
                                <button onClick={toggleSidebar} className="close-btn"><X size={18} /></button>
                            </div>

                            <div className="sidebar-content">
                                {user && (
                                    <div className="sidebar-user-card aero-glass">
                                        <img src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'} className="sidebar-avatar" />
                                        <div className="sidebar-user-info">
                                            <strong>{user.username}</strong>
                                        </div>
                                    </div>
                                )}

                                <div className="sidebar-links">
                                    {menuItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveTab(item.id); toggleSidebar(); }}
                                            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                            {item.badge > 0 && <span className="badge">{item.badge}</span>}
                                        </button>
                                    ))}
                                </div>

                                <div className="sidebar-divider" />

                                <div className="sidebar-actions">
                                    <button onClick={toggleTheme} className="sidebar-item">
                                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                        Theme
                                    </button>
                                    {user ? (
                                        <button onClick={() => { logout(); toggleSidebar(); }} className="sidebar-item logout">
                                            <LogOut size={18} /> Logout
                                        </button>
                                    ) : (
                                        <button onClick={() => { setShowAuth(true); toggleSidebar(); }} className="sidebar-item login">
                                            <User size={18} /> Login
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Tabs Ribbon */}
            <div className="desktop-tabs-ribbon aero-glass">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`ribbon-tab ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge > 0 && <span className="ribbon-badge">{item.badge}</span>}
                    </button>
                ))}
            </div>

            <style jsx>{`
                .xp-header {
                    position: sticky; top: 0; z-index: 1000;
                    padding: 8px 16px;
                    display: flex; align-items: center; justify-content: space-between;
                    background: linear-gradient(to bottom, rgba(36, 94, 220, 0.9) 0%, rgba(36, 94, 220, 0.6) 100%);
                    border-bottom: 2px solid rgba(255,255,255,0.3);
                    height: 60px;
                }

                .header-left { display: flex; align-items: center; gap: 16px; }

                .start-button {
                    background: linear-gradient(180deg, #3C8E42 0%, #2E6032 100%);
                    border: 1px solid #1E4022;
                    border-radius: 4px 14px 14px 4px;
                    padding: 4px 16px 4px 8px;
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer;
                    box-shadow: 0 0 5px rgba(0,0,0,0.5);
                    font-style: italic; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                .start-icon { width: 24px; height: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }

                .logo-text {
                    font-family: 'Trebuchet MS', 'Tahoma', sans-serif;
                    font-style: italic; font-size: 22px; color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                    margin: 0;
                }

                .header-actions { display: flex; align-items: center; gap: 10px; }
                .desktop-actions { display: flex; align-items: center; gap: 10px; }
                
                .admin-badge {
                    background: red; color: white; padding: 2px 8px; border-radius: 4px;
                    font-size: 10px; font-weight: bold; display: flex; gap: 4px;
                }

                .user-section {
                    display: flex; align-items: center; gap: 8px;
                    padding: 4px 8px; border-radius: 8px;
                }

                .user-btn {
                    background: none; border: none; display: flex; align-items: center; gap: 8px;
                    color: inherit; cursor: pointer; font-family: inherit; font-size: 14px;
                }
                .user-avatar { width: 24px; height: 24px; border-radius: 4px; border: 1px solid white; }
                .small-btn { padding: 4px; }

                .mobile-only { display: none; }
                @media (max-width: 768px) {
                    .desktop-actions { display: none; }
                    .mobile-only { display: block; }
                    .logo-text { font-size: 18px; }
                    .start-button { padding: 4px 10px; border-radius: 4px; }
                    .start-text { display: none; }
                }

                /* Sidebar */
                .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998; }
                .xp-sidebar {
                    position: fixed; top: 0; left: 0; bottom: 0; width: 280px;
                    z-index: 9999; background: #fff;
                    display: flex; flex-direction: column;
                }
                
                .close-btn { background: none; border: none; color: white; cursor: pointer; }

                .sidebar-content { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
                .sidebar-user-card { 
                    display: flex; align-items: center; gap: 12px; padding: 12px;
                    border: 1px solid #CCC; margin-bottom: 16px;
                }
                .sidebar-avatar { width: 48px; height: 48px; border-radius: 4px; border: 1px solid #999; }
                
                .sidebar-item {
                    width: 100%; border: none; background: none; text-align: left;
                    padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px;
                    font-size: 15px; color: #333; border-radius: 4px;
                }
                .sidebar-item:hover { background: #245EDC; color: white; }
                .sidebar-item.active { background: #245EDC; color: white; font-weight: bold; }
                
                .sidebar-divider { height: 1px; background: linear-gradient(90deg, transparent, #CCC, transparent); margin: 8px 0; }

                /* Desktop Ribbon */
                .desktop-tabs-ribbon {
                    display: flex; justify-content: center; gap: 4px; padding: 8px;
                    margin-top: 10px; margin-bottom: 20px;
                }
                @media (max-width: 768px) { .desktop-tabs-ribbon { display: none; } }

                .ribbon-tab {
                    background: transparent; border: 1px solid transparent;
                    padding: 6px 16px; border-radius: 4px 4px 0 0;
                    cursor: pointer; display: flex; align-items: center; gap: 8px;
                    color: white; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    transition: all 0.2s;
                }
                
                .ribbon-tab:hover {
                    background: rgba(255,255,255,0.2);
                    border-top: 1px solid rgba(255,255,255,0.5);
                }
                
                .ribbon-tab.active {
                    background: rgba(255,255,255,0.3);
                    border: 1px solid rgba(255,255,255,0.6);
                    border-bottom: none;
                    box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
                }
                
                .ribbon-badge { font-size: 10px; background: #E68B2C; padding: 2px 6px; border-radius: 10px; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }

            `}</style>
        </>
    );
}