
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
                <h1
                    onClick={() => setActiveTab('feed')}
                    className="logo"
                >SINOPINHAS</h1>

                <div className="header-actions">
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
            </header>


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
                    fontSize: 11px;
                    fontWeight: 600;
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
