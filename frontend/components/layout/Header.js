
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
        { id: 'feed', label: 'Explorar', icon: '🎨' },
        { id: 'news', label: 'Notícias', icon: '📰' },
        { id: 'eventos', label: 'Eventos', icon: '📅' },
        { id: 'lugares', label: 'Lugares', icon: '📍' },
        { id: 'weather', label: 'Clima', icon: '⛅' },
        { id: 'inbox', label: 'Mensagens', icon: '💬', badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Admin', icon: '⚙️' } : null,
        showSecretTab ? { id: 'secret', label: 'Secreto', icon: '🔒' } : null
    ].filter(Boolean);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <>
            <header
                className="glass"
                style={{
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    transition: 'all 0.3s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1
                        onClick={() => setActiveTab('feed')}
                        className="logo"
                    >SINOPINHAS</h1>
                </div>

                <div className="header-actions">
                    {/* Botão do Menu Sidebar (Mobile) */}
                    <button onClick={toggleSidebar} className="action-btn menu-btn-mobile" title="Menu">
                        <span className="btn-icon">☰</span>
                    </button>

                    <div className="desktop-actions">
                        <button
                            onClick={toggleTheme}
                            className="action-btn theme-toggle"
                            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        <button onClick={() => setShowSecretAuth(true)} className="action-btn restricted-btn" title="Área Restrita">
                            <span className="btn-icon">🔒</span>
                            <span className="btn-text">Restrito</span>
                        </button>

                        <button onClick={() => setShowSupport(true)} className="action-btn support-btn" title="Suporte">
                            <span className="btn-icon">🆘</span>
                            <span className="btn-text">Suporte</span>
                        </button>

                        {isAdmin && (
                            <span className="admin-badge">ADMIN</span>
                        )}

                        {user ? (
                            <div className="user-section">
                                <button onClick={() => setShowProfile(true)} className="profile-btn">
                                    {user.avatar && (
                                        <img
                                            src={user.avatar}
                                            className="user-avatar"
                                            alt={user.username}
                                        />
                                    )}
                                    <strong className="username">{user.username}</strong>
                                </button>

                                <button onClick={logout} className="action-btn logout-btn">Sair</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="action-btn login-btn">Login</button>
                        )}

                        {!isAdmin ? (
                            <button onClick={() => setShowAdminAuth(true)} className="action-btn admin-login-btn">Admin</button>
                        ) : (
                            <button onClick={logoutAdmin} className="action-btn admin-logout-btn">Sair Admin</button>
                        )}
                    </div>

                    {/* Versão simplificada para mobile no Header (mostra só avatar se logado) */}
                    <div className="mobile-header-user">
                        {user ? (
                            <img
                                src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                                className="user-avatar-mobile"
                                onClick={() => setShowProfile(true)}
                                alt={user.username}
                            />
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="action-btn login-btn-mobile">Login</button>
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar} />
            )}

            {/* Sidebar Drawer */}
            <aside className={`sidebar-drawer ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="logo" style={{ fontSize: 20 }}>SINOPINHAS</h2>
                    <button onClick={toggleSidebar} className="close-sidebar">×</button>
                </div>

                <div className="sidebar-content">
                    <div className="sidebar-section">
                        <p className="sidebar-label">Navegação</p>
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
                        <p className="sidebar-label">Ações</p>
                        <button onClick={() => { toggleTheme(); toggleSidebar(); }} className="sidebar-item">
                            <span className="item-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                            <span className="item-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                        </button>
                        <button onClick={() => { setShowSupport(true); toggleSidebar(); }} className="sidebar-item">
                            <span className="item-icon">🆘</span>
                            <span className="item-label">Suporte</span>
                        </button>
                        <button onClick={() => { setShowSecretAuth(true); toggleSidebar(); }} className="sidebar-item">
                            <span className="item-icon">🔒</span>
                            <span className="item-label">Restrito</span>
                        </button>
                    </div>

                    <div className="sidebar-footer">
                        {isAdmin ? (
                            <button onClick={() => { logoutAdmin(); toggleSidebar(); }} className="action-btn admin-logout-btn" style={{ width: '100%', marginBottom: 12 }}>Sair do Admin</button>
                        ) : (
                            <button onClick={() => { setShowAdminAuth(true); toggleSidebar(); }} className="action-btn admin-login-btn" style={{ width: '100%', marginBottom: 12 }}>Painel Admin</button>
                        )}
                        {user && (
                            <button onClick={() => { logout(); toggleSidebar(); }} className="action-btn logout-btn" style={{ width: '100%' }}>Encerrar Sessão</button>
                        )}
                    </div>
                </div>
            </aside>


            <nav className="tab-container">
                {['feed', 'upload', 'eventos', 'news', 'lugares', 'weather', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab === 'feed' ? '🎨 Explorar' :
                            tab === 'news' ? '📰 Notícias' :
                                tab === 'lugares' ? '📍 Lugares' :
                                    tab === 'weather' ? '⛅ Clima' :
                                        tab === 'upload' ? '📤 Upload' :
                                            tab === 'eventos' ? '📅 Eventos' :
                                                tab === 'admin' ? '⚙️ Admin' :
                                                    tab === 'inbox' ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            💬 Mensagens
                                                            {unreadCount > 0 && (
                                                                <span className="badge">{unreadCount}</span>
                                                            )}
                                                        </span>
                                                    ) : '🔒 Secreto'}
                    </button>
                ))}
            </nav>

            <style jsx>{`
                .logo {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 1000;
                    letter-spacing: -1px;
                    background: linear-gradient(90deg, #8d6aff, #fe7d45 60%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    cursor: pointer;
                    user-select: none;
                    flex-shrink: 0;
                    min-width: 180px;
                }

                header {
                    padding: 12px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    transition: all 0.3s ease;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    justify-content: flex-end;
                    flex: 1;
                }

                .action-btn {
                    padding: 8px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: none;
                    color: #fff;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                }

                .theme-toggle {
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                    padding: 8px !important;
                    font-size: 18px;
                }

                .restricted-btn { background: #e53e3e; }
                .support-btn { background: #3182ce; }
                .login-btn { background: var(--accent-color); padding: 8px 16px; }
                .admin-login-btn { background: #10b981; }
                .admin-logout-btn { background: #ef4444; }
                .logout-btn { background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-color); }

                .admin-badge {
                    padding: 5px 10px;
                    background: #10b981;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #fff;
                }

                .user-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    cursor: pointer;
                    color: var(--text-color);
                    max-width: 150px;
                }

                .user-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .username {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 13px;
                }

                @media (max-width: 768px) {
                    header {
                        padding: 10px 16px;
                    }
                    .logo {
                        font-size: 20px;
                        min-width: 120px;
                    }

                    .btn-text, .logout-btn, .admin-login-btn, .admin-logout-btn {
                        display: none;
                    }

                    .action-btn {
                        padding: 10px;
                        border-radius: 12px;
                        font-size: 18px;
                    }

                    .restricted-btn, .support-btn {
                        width: 42px;
                        height: 42px;
                    }

                    .profile-btn {
                        padding: 4px;
                        border-radius: 50%;
                        width: 42px;
                        height: 42px;
                        justify-content: center;
                        background: var(--accent-color);
                        border: none;
                    }

                    .username {
                        display: none;
                    }

                    .user-avatar {
                        width: 34px;
                        height: 34px;
                        margin: 0;
                    }

                    .desktop-actions {
                        display: none;
                    }

                    .menu-btn-mobile {
                        display: flex;
                        background: var(--input-bg);
                        border: 1px solid var(--border-color);
                        color: var(--text-color);
                        width: 42px;
                        height: 42px;
                        border-radius: 12px;
                        font-size: 20px;
                    }

                    .login-btn-mobile {
                        background: var(--accent-color);
                        padding: 8px 16px;
                        font-size: 14px;
                    }

                    .user-avatar-mobile {
                        width: 42px;
                        height: 42px;
                        border-radius: 50%;
                        border: 2px solid var(--accent-color);
                        object-fit: cover;
                    }
                }

                /* Sidebar Styles */
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 9998;
                    animation: fadeIn 0.3s ease;
                }

                .sidebar-drawer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    width: 280px;
                    background: var(--bg-color);
                    z-index: 9999;
                    transform: translateX(-100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid var(--border-color);
                    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
                }

                .sidebar-drawer.open {
                    transform: translateX(0);
                }

                .sidebar-header {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid var(--border-color);
                }

                .close-sidebar {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    font-size: 28px;
                    cursor: pointer;
                }

                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .sidebar-section {
                    margin-bottom: 30px;
                }

                .sidebar-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--secondary-text);
                    margin-bottom: 12px;
                    padding-left: 12px;
                    font-weight: 700;
                }

                .sidebar-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: none;
                    border: none;
                    color: var(--text-color);
                    border-radius: 12px;
                    cursor: pointer;
                    margin-bottom: 4px;
                    transition: all 0.2s ease;
                    font-size: 15px;
                    font-weight: 600;
                }

                .sidebar-item:hover, .sidebar-item.active {
                    background: var(--glass-bg);
                    color: var(--accent-color);
                }

                .sidebar-item.active {
                    background: rgba(141, 106, 255, 0.1);
                }

                .item-icon {
                    font-size: 18px;
                }

                .item-badge {
                    margin-left: auto;
                    background: #ff4757;
                    color: #fff;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                }

                .sidebar-footer {
                    padding: 20px;
                    border-top: 1px solid var(--border-color);
                }

                @media (min-width: 769px) {
                    .menu-btn-mobile, .mobile-header-user, .sidebar-drawer, .sidebar-overlay {
                        display: none;
                    }
                }

                .tab-container {
                    background: var(--header-bg);
                    padding: 16px 24px;
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 1px;
                    transition: background 0.3s ease, border-color 0.3s ease;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                @media (max-width: 768px) {
                    .tab-container {
                        display: none;
                    }
                }
                .tab-container::-webkit-scrollbar {
                    display: none;
                }

                .tab-btn {
                    padding: 10px 20px;
                    border-radius: 99px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--secondary-text);
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    outline: none;
                }

                .tab-btn:hover {
                    background: var(--accent-color);
                    color: #fff;
                    transform: translateY(-2px);
                    border-color: transparent;
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    color: #fff;
                    font-weight: 600;
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(141, 106, 255, 0.3);
                    transform: translateY(-1px);
                }

                .badge {
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: bold;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
            `}</style>

        </>
    );
}
