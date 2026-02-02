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
        { id: 'feed', label: 'Explorar', icon: <LayoutGrid size={18} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={18} /> },
        { id: 'eventos', label: 'Eventos', icon: <Calendar size={18} /> },
        { id: 'lugares', label: 'Lugares', icon: <MapPin size={18} /> },
        { id: 'weather', label: 'Clima', icon: <CloudSun size={18} /> },
        { id: 'inbox', label: 'Mensagens', icon: <MessageCircle size={18} />, badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Admin', icon: <Settings size={18} /> } : null,
        showSecretTab ? { id: 'secret', label: 'Secreto', icon: <Lock size={18} /> } : null
    ].filter(Boolean);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="header-wrapper">
            {/* Top Banner / Glass Header */}
            <div className="aero-header-top">
                <div className="left-brand">
                    <motion.div whileHover={{ scale: 1.1 }} className="logo-bubble">
                        <img src="/icons/icon-192x192.png" alt="S" className="logo-img" onError={(e) => e.target.style.display = 'none'} />
                    </motion.div>
                    <h1 className="brand-text">SINOPINHAS</h1>
                </div>

                <div className="right-tools">
                    <button onClick={toggleTheme} className="glass-circle-btn">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    {isAdmin && <span className="admin-pill"><ShieldCheck size={12} /> Admin Mode</span>}

                    {user ? (
                        <div className="user-profile-glass" onClick={() => setShowProfile(true)}>
                            <img src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'} className="user-img-circle" />
                            <span>{user.username}</span>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuth(true)} className="glass-pill-btn">
                            <User size={16} /> Login
                        </button>
                    )}

                    <button className="glass-circle-btn mobile-only" onClick={toggleSidebar}>
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation Ribbon */}
            <nav className="aero-ribbon-container">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`aero-tab ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge > 0 && <span className="tab-badge">{item.badge}</span>}
                    </button>
                ))}
            </nav>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="sidebar-backdrop"
                            onClick={toggleSidebar}
                        />

                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="frutiger-sidebar glass-panel"
                        >
                            <div className="sidebar-head">
                                <h3>Menu</h3>
                                <button onClick={toggleSidebar} className="close-btn"><X size={20} /></button>
                            </div>

                            <div className="sidebar-menu-list">
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id); toggleSidebar(); }}
                                        className={`sidebar-row ${activeTab === item.id ? 'active' : ''}`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="sidebar-foot">
                                <button onClick={() => setShowSupport(true)}>Suporte</button>
                                {user && <button onClick={logout} className="logout-text">Sair</button>}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <style jsx>{`
                .header-wrapper {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
                    padding: 10px 20px 0;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .aero-header-top {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 20px;
                }

                .left-brand { display: flex; align-items: center; gap: 12px; }
                .logo-bubble {
                    width: 42px; height: 42px; background: rgba(255,255,255,0.2);
                    border-radius: 50%; padding: 4px; border: 1px solid rgba(255,255,255,0.5);
                    box-shadow: 0 0 10px rgba(255,255,255,0.3);
                }
                .logo-img { width: 100%; height: 100%; object-fit: contain; }
                .brand-text {
                    font-size: 24px; font-weight: 800; color: white; margin: 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    letter-spacing: 1px;
                }

                .right-tools { display: flex; align-items: center; gap: 12px; }

                .glass-circle-btn {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.4);
                    color: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                .glass-circle-btn:hover { background: rgba(255,255,255,0.3); box-shadow: 0 0 10px white; }

                .user-profile-glass {
                    display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px;
                    border-radius: 20px; background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.3); cursor: pointer; color: white; font-weight: bold;
                    transition: background 0.2s;
                }
                .user-profile-glass:hover { background: rgba(255,255,255,0.25); }
                .user-img-circle { width: 28px; height: 28px; border-radius: 50%; border: 1px solid white; }

                .glass-pill-btn {
                    padding: 6px 16px; border-radius: 20px;
                    background: linear-gradient(180deg, #81D4FA 0%, #0288D1 100%);
                    border: 1px solid rgba(255,255,255,0.6); color: white; font-weight: bold;
                    display: flex; align-items: center; gap: 6px; cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                .glass-pill-btn:hover { filter: brightness(1.1); }

                .admin-pill {
                    background: #F44336; color: white; padding: 2px 8px; border-radius: 10px;
                    font-size: 10px; font-weight: bold; display: flex; align-items: center; gap: 4px;
                    border: 1px solid rgba(255,255,255,0.4);
                }

                .aero-ribbon-container {
                    display: flex; justify-content: center; gap: 4px;
                    padding-bottom: 0;
                }
                
                .tab-badge {
                   background: #FF3D00; color: white; padding: 1px 5px; border-radius: 8px; font-size: 10px;
                   box-shadow: 0 1px 2px rgba(0,0,0,0.3); margin-left: 6px; border: 1px solid white;
                }

                .mobile-only { display: none; }
                @media (max-width: 768px) {
                    .aero-ribbon-container { display: none; } /* Hide tabs on mobile, show in sidebar */
                    .mobile-only { display: flex; }
                    .brand-text { font-size: 18px; }
                }

                /* Sidebar */
                .sidebar-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000; backdrop-filter: blur(4px); }
                .frutiger-sidebar {
                    position: fixed; top: 10px; right: 10px; bottom: 10px; width: 260px;
                    z-index: 2001; display: flex; flex-direction: column;
                    background: rgba(10, 40, 80, 0.85);
                    border: 1px solid rgba(255,255,255,0.3);
                }
                
                .sidebar-head {
                    padding: 16px; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.1); color: white;
                }
                .close-btn { background: none; border: none; color: white; cursor: pointer; }

                .sidebar-menu-list { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
                .sidebar-row {
                    display: flex; alignItems: center; gap: 12px; padding: 12px;
                    background: transparent; border: none; color: white; text-align: left;
                    border-radius: 8px; cursor: pointer; font-size: 16px;
                }
                .sidebar-row:hover { background: rgba(255,255,255,0.1); }
                .sidebar-row.active { background: linear-gradient(90deg, rgba(0,198,255,0.2), transparent); border-left: 3px solid #00C6FF; }

                .sidebar-foot { padding: 16px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; }
                .logout-text { background: none; border: none; color: #FF8A80; cursor: pointer; margin-left: 10px; }
            `}</style>
        </div>
    );
}