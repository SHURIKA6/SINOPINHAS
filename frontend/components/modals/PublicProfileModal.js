import { useState, useEffect } from 'react';
import { fetchPublicProfile } from '../../services/api';

export default function PublicProfileModal({ userId, onClose, onAchievementClick }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await fetchPublicProfile(userId);
            setUser(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                    <div className="spinner"></div>
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>👤 Perfil de {user.username}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ position: 'relative', width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)', marginBottom: 12 }}>
                        {user.avatar ?
                            <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={user.username} /> :
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        }
                    </div>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{user.username}</h3>
                    {user.bio && <p style={{ color: 'var(--secondary-text)', textAlign: 'center', marginTop: 10, fontSize: 14 }}>{user.bio}</p>}
                </div>

                <div style={{ gridTemplateColumns: 'repeat(3, 1fr)', display: 'grid', gap: 10, marginBottom: 24 }}>
                    <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 16, textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: 18, fontWeight: 800 }}>{user.video_count || 0}</span>
                        <span style={{ fontSize: 10, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Vídeos</span>
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 16, textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: 18, fontWeight: 800 }}>{user.total_likes || 0}</span>
                        <span style={{ fontSize: 10, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Curtidas</span>
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 16, textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: 18, fontWeight: 800 }}>{new Date(user.created_at).getFullYear()}</span>
                        <span style={{ fontSize: 10, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Membro</span>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Conquistas</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {user.achievements?.map(ach => (
                            <button
                                key={ach.type}
                                onClick={() => onAchievementClick(ach)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: `${ach.color}15`, border: `1px solid ${ach.color}30`,
                                    padding: '8px 16px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                                    color: ach.color, cursor: 'pointer', transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span>{ach.icon}</span> {ach.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => {
                        // Navegar para o chat com essa pessoa
                        window.location.href = `/?tab=inbox&u=${user.id}`;
                        onClose();
                    }}
                    style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(141, 106, 255, 0.3)' }}
                >
                    Enviar Mensagem
                </button>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.85); z-index: 9999; display: flex;
                        align-items: center; justifyContent: center; padding: 20px;
                        backdrop-filter: blur(8px);
                    }
                    .modal-content {
                        border-radius: 24px; padding: 32px;
                        maxWidth: 440px; width: 100%;
                        maxHeight: 90vh; overflow-y: auto;
                        color: var(--text-color);
                        boxShadow: 0 20px 50px rgba(0,0,0,0.5);
                        animation: fadeIn 0.3s ease-out;
                    }
                    .spinner {
                        width: 40px; height: 40px; border: 4px solid var(--border-color);
                        border-top: 4px solid var(--accent-color); border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        </div>
    );
}
