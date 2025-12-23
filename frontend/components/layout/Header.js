import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, Sun, Moon, Lock, LifeBuoy,
    LogOut, User, Settings, LayoutGrid,
    Newspaper, Calendar, MapPin, CloudSun,
    MessageCircle, ShieldCheck
} from 'lucide-react';

// Cabeçalho
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
    setShowProfileModal,
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
            <header className="glass header-container">
                <div className="header-left">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="logo-container"
                        onClick={() => setActiveTab('feed')}
                    >
                        <h1 className="logo-text">SINOPINHAS</h1>
                    </motion.div>
                </div>

                <div className="header-actions">
                    {/* Botão do Menu Sidebar (Mobile) */}
                    <button onClick={toggleSidebar} className="menu-btn-mobile">
                        <Menu size={24} />
                    </button>

                    <div className="desktop-actions">
                        <button
                            onClick={toggleTheme}
                            className="icon-btn theme-toggle"
                            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button onClick={() => setShowSecretAuth(true)} className="action-btn restricted-btn">
                            <Lock size={16} />
                            <span>Restrito</span>
                        </button>

                        <button onClick={() => setShowSupport(true)} className="action-btn support-btn">
                            <LifeBuoy size={16} />
                            <span>Suporte</span>
                        </button>

                        {isAdmin && (
                            <div className="admin-status">
                                <ShieldCheck size={14} />
                                <span>ADMIN</span>
                            </div>
                        )}

                        {user ? (
                            <div className="user-section">
                                <button onClick={() => setShowProfile(true)} className="profile-trigger">
                                    <div className="avatar-wrapper">
                                        <img
                                            src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                                            className="user-avatar"
                                            alt={user.username}
                                        />
                                    </div>
                                    <strong className="username">{user.username}</strong>
                                </button>

                                <button onClick={logout} className="logout-button" title="Sair">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="action-btn login-btn">
                                <User size={16} />
                                <span>Entrar</span>
                            </button>
                        )}

                        {!isAdmin ? (
                            <button onClick={() => setShowAdminAuth(true)} className="admin-trigger-btn">
                                <Settings size={16} />
                            </button>
                        ) : (
                            <button onClick={logoutAdmin} className="admin-logout-btn">
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>

                    {/* Versão simplificada para mobile no Header */}
                    <div className="mobile-header-user">
                        {user ? (
                            <img
                                src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                                className="user-avatar-mobile"
                                onClick={() => setShowProfile(true)}
                                alt={user.username}
                            />
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="login-btn-mini">
                                <User size={20} />
                            </button>
                        )}
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
                            className="sidebar-drawer"
                        >
                            <div className="sidebar-header">
                                <h2 className="logo" style={{ fontSize: 20 }}>SINOPINHAS</h2>
                                <button onClick={toggleSidebar} className="close-sidebar">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="sidebar-content">
                                <div className="sidebar-section">
                                    <p className="sidebar-label">Navegação Principal</p>
                                    {menuItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveTab(item.id); toggleSidebar(); }}
                                            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                                        >
                                            <span className="item-icon">{item.icon}</span>
                                            <span className="item-label">{item.label}</span>
                                            {item.badge > 0 && <span className="item-badge">{item.badge}</span>}
                                        </button>
                                    ))}
                                </div>

                                <div className="sidebar-section">
                                    <p className="sidebar-label">Preferências & Ajuda</p>
                                    <button onClick={() => { toggleTheme(); toggleSidebar(); }} className="sidebar-item">
                                        <span className="item-icon">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</span>
                                        <span className="item-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                                    </button>
                                    <button onClick={() => { setShowSupport(true); toggleSidebar(); }} className="sidebar-item">
                                        <span className="item-icon"><LifeBuoy size={20} /></span>
                                        <span className="item-label">Suporte</span>
                                    </button>
                                    <button onClick={() => { setShowSecretAuth(true); toggleSidebar(); }} className="sidebar-item">
                                        <span className="item-icon"><Lock size={20} /></span>
                                        <span className="item-label">Área Restrita</span>
                                    </button>
                                </div>
                            </div>

                            <div className="sidebar-footer">
                                {isAdmin ? (
                                    <button onClick={() => { logoutAdmin(); toggleSidebar(); }} className="sidebar-action-btn admin-out">
                                        <ShieldCheck size={18} />
                                        <span>Sair do Admin</span>
                                    </button>
                                ) : (
                                    <button onClick={() => { setShowAdminAuth(true); toggleSidebar(); }} className="sidebar-action-btn admin-in">
                                        <Settings size={18} />
                                        <span>Painel Admin</span>
                                    </button>
                                )}
                                {user && (
                                    <button onClick={() => { logout(); toggleSidebar(); }} className="sidebar-action-btn logout">
                                        <LogOut size={18} />
                                        <span>Encerrar Sessão</span>
                                    </button>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <nav className="tab-container-desktop">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`tab-btn ${activeTab === item.id ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge > 0 && <span className="badge">{item.badge}</span>}
                    </button>
                ))}
            </nav>

            <style jsx>{`
                .header-container {
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .logo-container {
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                }
                
                .logo-text {
                    font-size: 24px;
                    font-weight: 1000;
                    margin: 0;
                    background: linear-gradient(135deg, #a855f7 0%, #ff6b9d 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -1.5px;
                    text-transform: uppercase;
                    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.2));
                }

                @media (max-width: 768px) {
                    .logo-text {
                        font-size: 20px;
                    }
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .desktop-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                @media (max-width: 1024px) {
                    .desktop-actions { display: none; }
                }

                .action-btn {
                    padding: 8px 18px;
                    border-radius: 14px;
                    font-size: 14px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: none;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .restricted-btn { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); }
                .support-btn { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
                
                .login-btn { 
                    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
                    color: white !important;
                }

                .login-btn span {
                    color: white;
                }
                
                .icon-btn, .admin-trigger-btn, .admin-logout-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                }

                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                    filter: brightness(1.1);
                }

                .admin-trigger-btn:hover, .admin-logout-btn:hover {
                    background: var(--glass-bg);
                    border-color: var(--accent-color);
                    color: var(--accent-color);
                }

                .admin-logout-btn {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: rgba(239, 68, 68, 0.2);
                }

                .admin-status {
                    padding: 6px 12px;
                    background: #10b981;
                    color: white;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .user-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--input-bg);
                    padding: 4px 4px 4px 12px;
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                }

                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: none;
                    border: none;
                    color: var(--text-color);
                    cursor: pointer;
                }

                .avatar-wrapper {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    padding: 2px;
                    background: linear-gradient(135deg, var(--accent-color), #ff6b9d);
                }

                .user-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1.5px solid var(--bg-color);
                }

                .username {
                    font-size: 14px;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .logout-button {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: none;
                    cursor: pointer;
                }

                .menu-btn-mobile {
                    display: none;
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                    align-items: center;
                    justify-content: center;
                }

                .mobile-header-user { display: none; }

                @media (max-width: 1024px) {
                    .menu-btn-mobile, .mobile-header-user { display: flex; }
                }

                .user-avatar-mobile {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    border: 2px solid var(--accent-color);
                    padding: 2px;
                }

                /* Sidebar Styles */
                .sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                    z-index: 9998;
                }

                .sidebar-drawer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: 300px;
                    background: var(--bg-color);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid var(--border-color);
                }

                .sidebar-header {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                }

                .sidebar-content {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                }

                .sidebar-section { margin-bottom: 32px; }

                .sidebar-label {
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--secondary-text);
                    margin-bottom: 16px;
                    padding-left: 12px;
                }

                .sidebar-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px;
                    border-radius: 16px;
                    border: none;
                    background: none;
                    color: var(--text-color);
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 4px;
                    transition: all 0.2s ease;
                }

                .sidebar-item:hover, .sidebar-item.active {
                    background: var(--glass-bg);
                    color: var(--accent-color);
                }

                .sidebar-item.active {
                    background: rgba(168, 85, 247, 0.1);
                    border: 1px solid rgba(168, 85, 247, 0.2);
                }

                .item-badge {
                    margin-left: auto;
                    background: #ff4757;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                }

                .sidebar-footer {
                    padding: 24px;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .sidebar-action-btn {
                    padding: 14px;
                    border-radius: 16px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .admin-in { background: #10b981; color: white; }
                .admin-out { background: #ef4444; color: white; }
                .logout { background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); }

                /* Desktop Tabs */
                .tab-container-desktop {
                    background: var(--header-bg);
                    padding: 16px 24px;
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    border-bottom: 1px solid var(--border-color);
                    backdrop-filter: blur(10px);
                }

                @media (max-width: 1024px) {
                    .tab-container-desktop { display: none; }
                }

                .tab-btn {
                    padding: 10px 20px;
                    border-radius: 99px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--secondary-text);
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .tab-btn:hover {
                    background: var(--accent-color);
                    color: white;
                    border-color: transparent;
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    color: white;
                    border-color: transparent;
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
                }

                .badge {
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 10px;
                }
            `}</style>
        </>
    );
}