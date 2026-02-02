import { useState, useEffect } from 'react';
import { fetchPublicProfile, fetchUserVideos } from '../../services/api';
import { Play } from 'lucide-react';

export default function ProfileFeed({ userId, onAchievementClick, onPostClick, onMessageClick }) {
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
                fetchUserVideos(userId, 50)
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
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
            <style jsx>{`
                .spinner {
                    width: 40px; height: 40px; border: 4px solid var(--border-color);
                    border-top: 4px solid var(--accent-color); border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (!user) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Usuário não encontrado</div>;

    return (
        <div className="profile-feed-container" style={{ padding: '20px 0', maxWidth: 800, margin: '0 auto' }}>
            {/* Header Profile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                <div style={{ position: 'relative', width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', marginBottom: 16 }}>
                    {user.avatar ?
                        <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={user.username} /> :
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 'bold', color: '#fff' }}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    }
                </div>
                <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{user.username}</h3>
                {user.bio && <p style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8, fontSize: 16, maxWidth: 400 }}>{user.bio}</p>}

                <button
                    onClick={() => onMessageClick(user.id)}
                    style={{ marginTop: 24, padding: '12px 32px', background: 'white', color: 'var(--accent-color)', border: 'none', borderRadius: 24, cursor: 'pointer', fontWeight: 800, fontSize: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                    Enviar Mensagem
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, padding: '0 16px' }}>
                <div className="stat-card">
                    <span style={{ display: 'block', fontSize: 24, fontWeight: 800 }}>{posts.length || 0}</span>
                    <span style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase' }}>Posts</span>
                </div>
                <div className="stat-card">
                    <span style={{ display: 'block', fontSize: 24, fontWeight: 800 }}>{user.total_likes || 0}</span>
                    <span style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase' }}>Curtidas</span>
                </div>
                <div className="stat-card">
                    <span style={{ display: 'block', fontSize: 24, fontWeight: 800 }}>{new Date(user.created_at).getFullYear()}</span>
                    <span style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase' }}>Membro</span>
                </div>
            </div>

            {/* Achievements */}
            {user.achievements && user.achievements.length > 0 && (
                <div style={{ marginBottom: 32, padding: '0 16px' }}>
                    <p style={{ fontSize: 14, color: 'white', marginBottom: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>🏆 Conquistas</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {user.achievements.map(ach => (
                            <button
                                key={ach.type}
                                onClick={() => onAchievementClick(ach)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '8px 16px', borderRadius: 99, fontSize: 14, fontWeight: 700,
                                    color: 'white', cursor: 'pointer', transition: 'transform 0.2s', backdropFilter: 'blur(5px)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span style={{ fontSize: 18 }}>{ach.icon}</span> {ach.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gallery */}
            <div style={{ padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 20 }}>📸</span>
                    <h4 style={{ margin: 0, fontSize: 18, color: 'white', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Galeria</h4>
                </div>

                {posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 24 }}>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Nenhuma publicação antiga ainda.</p>
                    </div>
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
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}
                            >
                                {post.type === 'photo' || (post.video_url && post.video_url.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                    <img src={post.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} className="zoom-hover" />
                                ) : (
                                    <video src={post.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}

                                {!(post.type === 'photo' || (post.video_url && post.video_url.match(/\.(jpeg|jpg|gif|png)$/) != null)) && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.9 }}>
                                        <Play size={20} fill="white" stroke="white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .stat-card {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(5px);
                    padding: 16px;
                    border-radius: 16px;
                    text-align: center;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .zoom-hover:hover {
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
}
