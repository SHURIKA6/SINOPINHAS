
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

            <div style={{ background: '#212121', padding: '0 24px', display: 'flex', gap: 24, borderBottom: '2px solid #303030', overflowX: 'auto' }}>
                {['videos', 'photos', 'upload', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '14px 20px', background: 'none', border: 'none',
                        borderBottom: activeTab === tab ? '3px solid #8d6aff' : '3px solid transparent',
                        color: activeTab === tab ? '#fff' : '#aaa', fontSize: 16,
                        fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
                        transition: 'all 0.3s', position: 'relative', whiteSpace: 'nowrap'
                    }}>
                        {tab === 'videos' ? 'Vídeos' : tab === 'photos' ? 'Fotos' : tab === 'upload' ? 'Upload' : tab === 'admin' ? 'Admin' : tab === 'inbox' ? (
                            <>
                                Mensagens
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: '#ef4444', borderRadius: '50%',
                                        width: 20, height: 20, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 'bold'
                                    }}>{unreadCount}</span>
                                )}
                            </>
                        ) : 'SAFADEZA'}
                    </button>
                ))}
            </div>
        </>
    );
}
