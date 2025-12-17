import { useState, useEffect, useMemo, useRef } from 'react';
import VideoCard from '../VideoCard';
import SkeletonVideoCard from '../SkeletonVideoCard';
import ShareModal from '../ShareModal';
import { fetchVideos, searchVideos, likeVideo, removeVideo } from '../../services/api';

export default function HomeFeed({ user, isAdmin, adminPassword, onVideoClick, showToast, canDelete, filterType = 'video' }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const VIDEOS_PER_PAGE = 12;
    const loadMoreRef = useRef(null); // Infinite Scroll Ref

    const [videoToShare, setVideoToShare] = useState(null);

    // Derived State
    const sortedVideos = useMemo(() => {
        let list = [...videos];
        if (sortBy === 'popular') list.sort((a, b) => b.views - a.views);
        else if (sortBy === 'liked') list.sort((a, b) => b.likes - a.likes);
        // 'recent' is default from DB usually, but we sort again just in case
        else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [videos, sortBy]);

    const paginatedVideos = sortedVideos.slice(0, page * VIDEOS_PER_PAGE);
    const hasMoreVideos = paginatedVideos.length < sortedVideos.length;

    // Infinite Scroll Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMoreVideos && !loading) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.1, rootMargin: '100px' });

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMoreVideos, loading]);

    useEffect(() => {
        loadVideos();
    }, [searchQuery, sortBy, filterType]); // Reload when search/sort/filter changes

    const loadVideos = async () => {
        setLoading(true);
        try {
            let data = [];
            if (searchQuery.trim().length > 2) {
                // Use Backend Search
                data = await searchVideos(searchQuery);
            } else {
                data = await fetchVideos(user?.id);
            }

            // Filter by type
            if (filterType === 'photo') {
                data = data.filter(v => v.type === 'photo');
            } else {
                // Video: include 'video' AND legacy (undefined/null)
                data = data.filter(v => !v.type || v.type === 'video');
            }

            setVideos(data);
        } catch (error) {
            console.error("Erro ao carregar vídeos:", error);
            showToast('error', 'Erro ao carregar conteúdo');
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (videoId) => {
        if (!user) return showToast('error', 'Faça login para curtir!');

        // Update UI immediately (optimistic)
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
            showToast('error', 'Erro ao curtir');
            loadVideos(); // Revert on error
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;

        try {
            await removeVideo(videoId, user?.id, isAdmin ? adminPassword : null);
            setVideos(prev => prev.filter(v => v.id !== videoId));
            showToast('success', 'Removido com sucesso!');
        } catch (err) {
            console.error(err);
            showToast('error', 'Erro ao excluir');
        }
    };


    const label = filterType === 'photo' ? 'foto' : 'vídeo';
    const Label = filterType === 'photo' ? 'Foto' : 'Vídeo';

    return (
        <div>
            <div style={{ padding: '24px 16px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                {/* Search and Sort */}
                <div style={{ marginBottom: 20, display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder={`🔍 Buscar ${label}s...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '12px 20px',
                            background: '#1a1a1a',
                            border: '1px solid #303030',
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
                <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
                    {loading ? 'Carregando...' : `${sortedVideos.length} ${label}${sortedVideos.length !== 1 ? 's' : ''}`}
                </h2>

                <div style={{ background: '#221c35', padding: 16, borderRadius: 16, marginBottom: 24, border: '1px solid #303030' }}>
                    <h3 style={{ marginTop: 0, fontSize: 22, color: '#fff' }}>🔥 Últimos Lançamentos do SINOPINHAS</h3>
                    <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: 16 }}>
                        Bem-vindo à comunidade oficial de Sinop! Aqui você encontra os melhores conteúdos locais.
                    </p>
                </div>

                {/* Grid */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {[...Array(8)].map((_, i) => (
                            <SkeletonVideoCard key={i} />
                        ))}
                    </div>
                ) : sortedVideos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                        <div style={{ fontSize: 41, marginBottom: 18 }}>{filterType === 'photo' ? '🖼️' : '📹'}</div>
                        <p style={{ fontSize: 19, margin: 0 }}>Nenhum {label} encontrado</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {paginatedVideos.map((v) => (
                                <VideoCard
                                    key={v.id}
                                    video={v}
                                    onDelete={handleDeleteVideo}
                                    onLike={toggleLike}
                                    onOpenComments={onVideoClick}
                                    canDelete={canDelete ? canDelete(v.user_id?.toString()) : (isAdmin || (user && user.id.toString() === v.user_id?.toString()))}
                                    isSecret={false}
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

                        {hasMoreVideos && (
                            <div
                                ref={loadMoreRef}
                                style={{
                                    textAlign: 'center',
                                    marginTop: 30,
                                    padding: '20px',
                                    color: '#8d6aff',
                                    opacity: 0.7
                                }}
                            >
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Carregando mais...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
