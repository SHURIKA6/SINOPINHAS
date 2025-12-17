
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
    setShowProfileModal
}) {
    return (
        <>
            <header style={{
                background: '#212121',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #303030',
                flexWrap: 'wrap',
                gap: '12px',
                position: 'relative'
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
                                background: '#303030',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: '#fff',
                                whiteSpace: 'nowrap',
                                maxWidth: '120px',
                                flexShrink: 0
                            }}>
                                {user.avatar && (
                                    <img
                                        src={user.avatar}
                                        loading="lazy"
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
                                background: '#303030',
                                color: '#fff',
                                border: 'none',
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
                {['videos', 'photos', 'news', 'weather', 'upload', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab === 'videos' ? '🎬 Vídeos' :
                            tab === 'photos' ? '📷 Fotos' :
                                tab === 'news' ? '📰 Notícias' :
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
                    background: #212121;
                    padding: 16px 24px;
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    border-bottom: 1px solid #303030;
                    margin-bottom: 1px;
                    
                    /* Hide scrollbar */
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .tab-container::-webkit-scrollbar {
                    display: none;
                }

                .tab-btn {
                    padding: 10px 20px;
                    border-radius: 99px; /* Pill Shape */
                    border: 1px solid transparent;
                    background: rgba(255, 255, 255, 0.03);
                    color: #aaa;
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

                /* Hover State */
                .tab-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    transform: translateY(-2px);
                }

                /* Active State */
                .tab-btn.active {
                    background: linear-gradient(135deg, #8d6aff 0%, #6040e6 100%);
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
