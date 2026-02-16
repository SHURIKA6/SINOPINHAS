import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, Play, Grid } from 'lucide-react';
import { fetchPublicProfile, fetchVideos, checkSession } from '../../services/api';

export async function getServerSideProps(context) {
    const { id } = context.query;
    // Opcional: Fetch inicial do servidor para SEO
    return { props: { id } };
}

export default function ProfilePage({ id }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado básico de sessão para saber se pode mandar mensagem
    const [sessionUser, setSessionUser] = useState(null);

    useEffect(() => {
        // Carregar sessão
        checkSession().then(u => setSessionUser(u)).catch(() => { });

        if (id) {
            loadProfile(id);
        }
    }, [id]);

    const loadProfile = async (userId) => {
        try {
            setLoading(true);
            setError(null);
            const [profileRes, postsRes] = await Promise.all([
                fetchPublicProfile(userId),
                fetchVideos(userId, 50)
            ]);
            setUser(profileRes.data);
            setPosts(postsRes.data || []);
        } catch (err) {
            console.error(err);
            setError('Usuário não encontrado ou erro ao carregar.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        // Tenta voltar, se não tiver histórico vai pro feed
        if (window.history.length > 2) {
            router.back();
        } else {
            router.push('/');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div className="spinner"></div>
                <style jsx>{`
          .spinner {
            width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid #fff; border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
                <h2 style={{ marginBottom: 16 }}>😕 Ops!</h2>
                <p>{error || 'Perfil indisponível'}</p>
                <button onClick={() => router.push('/')} style={{ marginTop: 24, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
                    Voltar ao Início
                </button>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{user.username} (@{user.username}) • Sinopinhas</title>
                <meta name="description" content={`Confira as fotos e vídeos de ${user.username} no Sinopinhas.`} />
            </Head>

            <div className="profile-page">
                {/* Header Fixo */}
                <header className="profile-header glass">
                    <button onClick={handleBack} className="back-btn">
                        <ArrowLeft size={24} color="#fff" />
                    </button>
                    <h1 className="username">{user.username}</h1>
                    <div style={{ width: 24 }}></div> {/* Espaçador para centralizar */}
                </header>

                <div className="profile-content">
                    {/* Info do Usuário */}
                    <div className="user-info">
                        <div className="avatar-container">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{posts.length}</span>
                                <span className="stat-label">Posts</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user.total_likes || 0}</span>
                                <span className="stat-label">Curtidas</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{new Date(user.created_at).getFullYear()}</span>
                                <span className="stat-label">Membro</span>
                            </div>
                        </div>
                    </div>

                    <div className="user-bio-section">
                        <h2 className="display-name">{user.username}</h2>
                        {user.bio && <p className="bio-text">{user.bio}</p>}

                        {/* Conquistas (Achievements) */}
                        {user.achievements && user.achievements.length > 0 && (
                            <div className="achievements-scroll">
                                {user.achievements.map((ach, idx) => (
                                    <div key={idx} className="achievement-badge" style={{ color: ach.color, background: `${ach.color}15`, borderColor: `${ach.color}30` }}>
                                        <span>{ach.icon}</span> {ach.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="actions-row">
                        <button
                            className="action-btn primary"
                            onClick={() => router.push(`/?tab=inbox&u=${user.id}`)}
                        >
                            Enviar Mensagem
                        </button>
                    </div>

                    {/* Grid de Posts */}
                    <div className="posts-section">
                        <div className="posts-tabs">
                            <div className="tab active">
                                <Grid size={20} />
                                <span>Publicações</span>
                            </div>
                        </div>

                        {posts.length === 0 ? (
                            <div className="empty-posts">
                                <div className="camera-icon">📸</div>
                                <p>Nenhuma publicação ainda</p>
                            </div>
                        ) : (
                            <div className="posts-grid">
                                {posts.map(post => (
                                    <div
                                        key={post.id}
                                        className="post-item"
                                        onClick={() => router.push(`/?v=${post.id}`)} // Abre o vídeo no feed "modo modal" ou similar. Por enquanto vai pra home com param v
                                    >
                                        {post.type === 'photo' || (post.video_url && post.video_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                                            <img src={post.video_url} alt="" loading="lazy" />
                                        ) : (
                                            <video src={post.video_url} muted playsInline />
                                        )}
                                        {post.type !== 'photo' && (
                                            <div className="video-indicator">
                                                <Play size={16} fill="white" stroke="white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .profile-page {
            min-height: 100vh;
            background: #000;
            color: #fff;
            padding-bottom: 20px;
        }

        .profile-header {
            position: fixed; top: 0; left: 0; right: 0;
            height: 60px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px;
            z-index: 100;
            backdrop-filter: blur(12px);
            background: rgba(0,0,0,0.6);
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .back-btn {
            background: none; border: none; cursor: pointer; padding: 8px; margin-left: -8px;
            display: flex; align-items: center; justify-content: center;
        }

        .username {
            font-size: 16px; font-weight: 700;
        }

        .profile-content {
            padding-top: 60px;
        }

        .user-info {
            display: flex; align-items: center;
            padding: 20px 20px 0 20px;
            gap: 24px;
        }

        .avatar-container {
            width: 86px; height: 86px;
            flex-shrink: 0;
            border-radius: 50%;
            padding: 2px;
            background: linear-gradient(135deg, #FF0080, #7928CA); /* Instagram-like gradient ring */
        }

        .avatar-img, .avatar-placeholder {
            width: 100%; height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #000; /* Separator from ring */
            background: #1a1a1a;
        }
        
        .avatar-placeholder {
            display: flex; align-items: center; justify-content: center;
            font-size: 32px; font-weight: bold; color: #fff;
        }

        .stats-row {
            display: flex; gap: 20px; text-align: center; flex: 1; justify-content: space-around;
        }

        .stat-value { display: block; font-size: 18px; font-weight: 700; }
        .stat-label { font-size: 13px; color: #aaa; }

        .user-bio-section {
            padding: 12px 20px;
        }

        .display-name { font-size: 15px; font-weight: 700; margin: 0 0 4px 0; }
        .bio-text { font-size: 14px; line-height: 1.4; color: #eee; white-space: pre-wrap; margin: 0; }

        .achievements-scroll {
            display: flex; gap: 8px; overflow-x: auto; 
            padding: 12px 0 4px 0;
            scrollbar-width: none;
        }
        .achievements-scroll::-webkit-scrollbar { display: none; }

        .achievement-badge {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 10px; borderRadius: 20px;
            font-size: 11px; font-weight: 600;
            border: 1px solid; white-space: nowrap;
        }

        .actions-row {
            padding: 0 20px 20px 20px;
        }

        .action-btn {
            width: 100%;
            padding: 8px;
            border-radius: 8px;
            font-weight: 600; font-size: 14px;
            border: none; cursor: pointer;
        }

        .action-btn.primary {
            background: #fff; color: #000;
        }
        
        .posts-section {
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        .posts-tabs {
            display: flex; justify-content: center;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .tab {
            display: flex; align-items: center; gap: 8px;
            padding: 12px;
            font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
            color: #aaa;
            border-top: 1px solid transparent;
        }
        
        .tab.active {
            color: #fff;
            border-top: 1px solid #fff;
            margin-top: -1px;
        }

        .posts-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
        }

        .post-item {
            aspect-ratio: 1/1;
            position: relative;
            background: #111;
            cursor: pointer;
        }

        .post-item img, .post-item video {
            width: 100%; height: 100%; object-fit: cover;
        }

        .video-indicator {
            position: absolute; top: 8px; right: 8px;
            opacity: 0.9;
        }

        .empty-posts {
            padding: 60px 20px;
            text-align: center;
            color: #666;
        }
        .camera-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
      `}</style>
        </>
    );
}
