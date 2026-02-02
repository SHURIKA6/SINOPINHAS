import { useState, useEffect } from 'react';
import { fetchPublicProfile, fetchVideos } from '../../services/api';
import { Play, Image as ImageIcon } from 'lucide-react';

export default function PublicProfileModal({ userId, onClose, onAchievementClick, onPostClick }) {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const [profileRes, postsRes] = await Promise.all([
                fetchPublicProfile(userId),
                fetchVideos(userId, 50) // Buscar últimos 50 posts
            ]);
            setUser(profileRes.data);
            setPosts(postsRes.data || []);
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
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        👤 {user.username}
                    </h2>
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
                        <span style={{ display: 'block', fontSize: 18, fontWeight: 800 }}>{posts.length || 0}</span>
                        <span style={{ fontSize: 10, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Posts</span>
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

                {/* Conquistas (Achievements) */}
                {user.achievements && user.achievements.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Conquistas</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {user.achievements.map(ach => (
                                <button
                                    key={ach.type}
                                    onClick={() => onAchievementClick(ach)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        background: `${ach.color}15`, border: `1px solid ${ach.color}30`,
                                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
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
                )}

                {/* Grade de Postagens */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                    <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>📸 Galeria</p>
                    {posts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--secondary-text)', fontStyle: 'italic', padding: 20 }}>Nenhuma publicação ainda.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                            {posts.map(post => (
                                <div
                                    key={post.id}
                                    onClick={() => onPostClick && onPostClick(post)}
                                    style={{
                                        aspectRatio: '1/1',
                                        background: '#000',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {post.type === 'photo' || (post.video_url && post.video_url.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                        <img src={post.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <video src={post.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}

                                    {/* Sobreposição de Ícone */}
                                    <div style={{ position: 'absolute', top: 4, right: 4, opacity: 0.8 }}>
                                        {post.type === 'photo' || (post.video_url && post.video_url.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                            null
                                        ) : (
                                            <Play size={16} fill="white" stroke="white" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 24 }}>
                    <button
                        onClick={() => {
                            window.location.href = `/?tab=inbox&u=${user.id}`;
                            onClose();
                        }}
                        style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(141, 106, 255, 0.3)' }}
                    >
                        Enviar Mensagem
                    </button>
                </div>

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
