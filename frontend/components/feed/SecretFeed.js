import { useState, useEffect, useMemo } from 'react';
import VideoCard from '../VideoCard';
import SkeletonVideoCard from '../SkeletonVideoCard';
import { fetchSecretVideos, likeVideo, removeVideo } from '../../services/api';

export default function SecretFeed({ user, isAdmin, adminPassword, onVideoClick, showToast, canDelete }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const VIDEOS_PER_PAGE = 12;

    useEffect(() => {
        loadVideos();
    }, [sortBy]); // No search for secret videos yet? Or local search. Backend search is public only.

    const loadVideos = async () => {
        setLoading(true);
        try {
            // NOTE: Backend search currently filters "v.is_restricted = false".
            // So we cannot use searchVideos(searchQuery) here for secret videos unless we update backend.
            // For now, we fetch all and filter client side if needed, or just fetch all.
            const data = await fetchSecretVideos(user?.id);
            setVideos(data);
        } catch (error) {
            console.error("Erro ao carregar vídeos secretos:", error);
            showToast('error', 'Erro ao carregar vídeos secretos');
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (videoId) => {
        if (!user) return showToast('error', 'Faça login para curtir!');

        setVideos(prev => prev.map(v => {
            if (v.id === videoId) {
                const isLiked = !v.user_liked;
                return {
                    ...v,
                    user_liked: isLiked,
                    likes: isLiked ? parseInt(v.likes) + 1 : parseInt(v.likes) - 1
                };
            }
            return v;
        }));

        try {
            await likeVideo(videoId, user.id);
        } catch (err) {
            showToast('error', 'Erro ao curtir vídeo');
            loadVideos();
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Tem certeza que deseja excluir este vídeo secreto?')) return;

        try {
            await removeVideo(videoId, user?.id, isAdmin ? adminPassword : null);
            setVideos(prev => prev.filter(v => v.id !== videoId));
            showToast('success', 'Vídeo removido com sucesso!');
        } catch (err) {
            console.error(err);
            showToast('error', 'Erro ao excluir vídeo');
        }
    };


    const sortedVideos = useMemo(() => {
        let list = [...videos];
        // Client-side search for now since backend doesn't support secret search yet
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(v => v.title.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q));
        }

        if (sortBy === 'popular') list.sort((a, b) => b.views - a.views);
        else if (sortBy === 'liked') list.sort((a, b) => b.likes - a.likes);
        else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [videos, sortBy, searchQuery]);

    const paginatedVideos = sortedVideos.slice(0, page * VIDEOS_PER_PAGE);
    const hasMoreVideos = paginatedVideos.length < sortedVideos.length;

    return (
        <div>
            <div style={{ padding: '24px 16px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {/* Search and Sort */}
                <div style={{ marginBottom: 20, display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔒 Buscar vídeos secretos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '12px 20px',
                            background: '#1a1a1a',
                            border: '1px solid #e53e3e', // Red border
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 16
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '12px 20px',
                            background: '#1a1a1a',
                            border: '1px solid #303030',
                            borderRadius: 10,
                            color: '#fff',
                            fontSize: 16,
                            cursor: 'pointer',
                            minWidth: '150px',
                            flex: 1
                        }}
                    >
                        <option value="recent">📅 Mais Recentes</option>
                        <option value="popular">🔥 Mais Visualizados</option>
                        <option value="liked">❤️ Mais Curtidos</option>
                    </select>
                </div>

                {/* Header */}
                <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20, color: '#ff6b9d' }}>
                    🔒 CONTEÚDO RESTRITO ({sortedVideos.length})
                </h2>

                {/* Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {[...Array(8)].map((_, i) => (
                            <SkeletonVideoCard key={i} />
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                        <div style={{ fontSize: 41, marginBottom: 18 }}>🔒</div>
                        <p style={{ fontSize: 19, margin: 0 }}>Nenhum conteúdo restrito encontrado</p>
                        <p style={{ fontSize: 14, marginTop: 8 }}>Use o checkbox "Tornar vídeo privado" ao enviar</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                            {paginatedVideos.map((v) => (
                                <VideoCard
                                    key={v.id}
                                    video={v}
                                    onDelete={handleDeleteVideo}
                                    onLike={toggleLike}
                                    onOpenComments={onVideoClick}
                                    canDelete={canDelete ? canDelete(v.user_id?.toString()) : (isAdmin || (user && user.id.toString() === v.user_id?.toString()))}
                                    isSecret={true}
                                />
                            ))}
                        </div>

                        {hasMoreVideos && (
                            <div style={{ textAlign: 'center', marginTop: 30 }}>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    style={{
                                        padding: '12px 32px',
                                        background: '#e53e3e',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Carregar Mais
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
