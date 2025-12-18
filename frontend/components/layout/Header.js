
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
            <header style={{
                background: 'var(--header-bg)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '12px',
                position: 'relative',
                transition: 'background 0.3s ease, border-color 0.3s ease'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: "2px",
                    background: "linear-gradient(90deg,#8d6aff,#fe7d45 60%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    minWidth: '180px',
                    flexShrink: 0
                }}>SINOPINHAS</h1>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    flex: 1
                }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            padding: '7px 10px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            fontSize: 18,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                        }}
                        title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <button onClick={() => setShowSecretAuth(true)} style={{
                        padding: '7px 12px',
                        background: '#e53e3e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}>
                        🔒 Restrito
                    </button>

                    <button onClick={() => setShowSupport(true)} style={{
                        padding: '7px 12px',
                        background: '#3182ce',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                    }}>
                        🆘 Suporte
                    </button>

                    {isAdmin && (
                        <span style={{
                            padding: '5px 10px',
                            background: '#10b981',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                            flexShrink: 0
                        }}>
                            ADMIN
                        </span>
                    )}

                    {user ? (
                        <>
                            <button onClick={() => setShowProfile(true)} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: 'var(--text-color)',
                                whiteSpace: 'nowrap',
                                maxWidth: '120px',
                                flexShrink: 0
                            }}>
                                {user.avatar && (
                                    <img
                                        src={user.avatar}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            flexShrink: 0
                                        }}
                                        alt={user.username}
                                    />
                                )}
                                <strong style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: 13
                                }}>{user.username}</strong>
                            </button>

                            <button onClick={logout} style={{
                                padding: '7px 12px',
                                background: 'var(--input-bg)',
                                color: 'var(--text-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                flexShrink: 0
                            }}>Sair</button>
                        </>
                    ) : (
                        <button onClick={() => setShowAuth(true)} style={{
                            padding: '7px 14px',
                            background: '#8d6aff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 13,
                            flexShrink: 0
                        }}>Login</button>
                    )}

                    {!isAdmin ? (
                        <button onClick={() => setShowAdminAuth(true)} style={{
                            padding: '7px 12px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 13,
                            flexShrink: 0
                        }}>Admin</button>
                    ) : (
                        <button onClick={logoutAdmin} style={{
                            padding: '7px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            flexShrink: 0
                        }}>Sair Admin</button>
                    )}
                </div>
            </header>


            <nav className="tab-container">
                {['videos', 'photos', 'upload', 'news', 'lugares', 'weather', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab === 'videos' ? '🎬 Vídeos' :
                            tab === 'photos' ? '📷 Fotos' :
                                tab === 'news' ? '📰 Notícias' :
                                    tab === 'lugares' ? '📍 Lugares' :
                                        tab === 'weather' ? '⛅ Clima' :
                                            tab === 'upload' ? '📤 Upload' :
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
