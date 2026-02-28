import { useState, useEffect, useMemo, useRef } from 'react';
import VideoCard from '../VideoCard';
import SkeletonVideoCard from '../SkeletonVideoCard';
import ShareModal from '../ShareModal';
import { fetchSecretVideos, likeVideo, removeVideo } from '../../services/api';

export default function SecretFeed({ user, isAdmin, adminPassword, onVideoClick, showToast, canDelete }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 12;
    const loadMoreRef = useRef(null);
    const [videoToShare, setVideoToShare] = useState(null);

    // Estado Derivado (Filtros e Ordenação)
    const sortedVideos = useMemo(() => {
        let list = [...videos];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(v => v.title.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q));
        }

        if (sortBy === 'popular') list.sort((a, b) => b.views - a.views);
        else if (sortBy === 'liked') list.sort((a, b) => b.likes - a.likes);
        else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [videos, sortBy, searchQuery]);

    // Observer para Rolagem Infinita
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setOffset(prev => prev + LIMIT);
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    // Resetar lista ao mudar ordenação
    useEffect(() => {
        setVideos([]);
        setOffset(0);
        setHasMore(true);
        loadVideos(0, true);
    }, [sortBy]);

    // Incrementar paginação (Offset)
    useEffect(() => {
        if (offset > 0) {
            loadVideos(offset, false);
        }
    }, [offset]);

    const loadVideos = async (currentOffset, reset = false) => {
        setLoading(true);
        try {
            const data = await fetchSecretVideos(user?.id, LIMIT, currentOffset);
            if (data.length < LIMIT) setHasMore(false);
            setVideos(prev => reset ? data : [...prev, ...data]);
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
            await likeVideo(videoId);
        } catch (err) {
            showToast('error', 'Erro ao curtir vídeo');
            loadVideos();
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Tem certeza que deseja excluir este vídeo secreto?')) return;

        try {
            await removeVideo(videoId);
            setVideos(prev => prev.filter(v => v.id !== videoId));
            showToast('success', 'Vídeo removido com sucesso!');
        } catch (err) {
            console.error(err);
            showToast('error', 'Erro ao excluir vídeo');
        }
    };

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
                            background: 'var(--input-bg)',
                            border: '1px solid #e53e3e',
                            borderRadius: 10,
                            color: 'var(--text-color)',
                            fontSize: 16
                        }}
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '12px 20px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 10,
                            color: 'var(--text-color)',
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

                <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20, color: '#ff6b9d' }}>
                    🔒 CONTEÚDO RESTRITO ({videos.length})
                </h2>

                {loading && videos.length === 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {[...Array(8)].map((_, i) => (
                            <SkeletonVideoCard key={i} />
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 64, background: 'var(--card-bg)', borderRadius: 16, color: 'var(--secondary-text)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 41, marginBottom: 18 }}>🔒</div>
                        <p style={{ fontSize: 19, margin: 0 }}>Nenhum conteúdo restrito encontrado</p>
                        <p style={{ fontSize: 14, marginTop: 8 }}>Use o checkbox "Tornar vídeo privado" ao enviar</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                            {sortedVideos.map((v) => (
                                <VideoCard
                                    key={v.id}
                                    video={v}
                                    onDelete={handleDeleteVideo}
                                    onLike={toggleLike}
                                    onOpenComments={onVideoClick}
                                    canDelete={canDelete ? canDelete(v.user_id?.toString()) : (isAdmin || (user && user.id.toString() === v.user_id?.toString()))}
                                    isSecret={true}
                                    onShare={(video) => setVideoToShare(video)}
                                />
                            ))}
                        </div>

                        {videoToShare && (
                            <ShareModal
                                video={videoToShare}
                                user={user}
                                onClose={() => setVideoToShare(null)}
                                showToast={showToast}
                            />
                        )}

                        {hasMore && (
                            <div
                                ref={loadMoreRef}
                                style={{
                                    textAlign: 'center',
                                    marginTop: 30,
                                    padding: '20px',
                                    color: '#e53e3e',
                                    opacity: 0.7
                                }}
                            >
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔒</span> Carregando conteúdo secreto...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
