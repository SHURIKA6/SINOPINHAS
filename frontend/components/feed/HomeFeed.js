import { useState, useEffect, useMemo, useRef } from 'react';
import VideoCard from '../VideoCard';
import SkeletonVideoCard from '../SkeletonVideoCard';
import ShareModal from '../ShareModal';
import { fetchVideos, searchVideos, likeVideo, removeVideo } from '../../services/api';
import { Search } from 'lucide-react';

export default function HomeFeed({ user, isAdmin, adminPassword, onVideoClick, showToast, canDelete, filterType: initialFilterType = 'all' }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [filterType, setFilterType] = useState(initialFilterType);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 12;

    const [hearts, setHearts] = useState([]);

    // Debounce da busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const loadMoreRef = useRef(null);

    const [videoToShare, setVideoToShare] = useState(null);

    // Estados derivados para ordenação
    const sortedVideos = useMemo(() => {
        let list = [...videos];
        if (sortBy === 'popular') list.sort((a, b) => b.views - a.views);
        else if (sortBy === 'liked') list.sort((a, b) => b.likes - a.likes);
        else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [videos, sortBy]);

    // Observador para rolagem infinita
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setOffset(prev => prev + LIMIT);
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    // Reinicia o offset quando os filtros mudam
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        loadVideos(0, true);
    }, [debouncedSearchQuery, sortBy, filterType]);

    // Carga incremental
    useEffect(() => {
        if (offset > 0) {
            loadVideos(offset, false);
        }
    }, [offset]);

    const loadVideos = async (currentOffset, reset = false) => {
        if (reset) setLoading(true); // Skeleton apenas no carregamento inicial ou reset
        try {
            let data = [];
            if (debouncedSearchQuery.trim().length > 2) {
                data = await searchVideos(debouncedSearchQuery);
                setHasMore(false);
            } else {
                data = await fetchVideos(user?.id, LIMIT, currentOffset, filterType === 'all' ? null : filterType);
                if (data.length < LIMIT) setHasMore(false);
            }

            setVideos(prev => reset ? data : [...prev, ...data]);
        } catch (error) {
            showToast('Erro ao carregar conteúdo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const spawnHeart = (e) => {
        const id = Date.now();
        const x = e.clientX;
        const y = e.clientY;
        setHearts(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setHearts(prev => prev.filter(h => h.id !== id));
        }, 1000);
    };

    const toggleLike = async (videoId, e) => {
        if (!user) return showToast('Faça login para curtir!', 'error');

        if (e) spawnHeart(e);

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
            showToast('Erro ao curtir', 'error');
            loadVideos();
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
            showToast('Erro ao excluir', 'error');
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Efeito de Corações */}
            {hearts.map(h => (
                <div key={h.id} style={{
                    position: 'fixed', left: h.x, top: h.y,
                    pointerEvents: 'none', zIndex: 10001,
                    fontSize: 24, animation: 'floatHeart 1s ease-out forwards'
                }}>❤️</div>
            ))}

            <div className="home-feed-container">

                {/* Cabeçalho de Busca e Filtros */}
                <div className="section-header">
                    <div className="search-row">
                        <div className="search-wrapper">
                            <span className="icon"><Search size={18} /></span>
                            <input
                                type="text"
                                placeholder="O que você quer ver hoje em Sinop?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input-global"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="recent">📅 Recentes</option>
                            <option value="popular">🔥 Populares</option>
                            <option value="liked">❤️ Curtidos</option>
                        </select>
                    </div>

                    {/* Sub-Tabs de Filtro */}
                    <div className="filter-tabs">
                        {['all', 'video', 'photo'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`filter-btn ${filterType === type ? 'active' : ''}`}
                            >
                                {type === 'all' && '🔥 Todos'}
                                {type === 'video' && '📹 Vídeos'}
                                {type === 'photo' && '📷 Fotos'}
                            </button>
                        ))}
                    </div>
                </div>

                <style jsx>{`
                    .home-feed-container {
                        padding: 24px 16px;
                        max-width: 1160px;
                        margin: 0 auto;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .search-row {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        margin-bottom: 24px;
                    }

                    .sort-select {
                        padding: 12px 16px;
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        color: var(--text-color);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        min-width: 140px;
                        transition: all 0.2s ease;
                    }

                    .sort-select:focus {
                        outline: none;
                        border-color: var(--accent-color);
                        box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
                    }

                    .filter-tabs {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        padding: 4px 0 20px;
                        scrollbar-width: none;
                    }

                    .filter-tabs::-webkit-scrollbar {
                        display: none;
                    }

                    .filter-btn {
                        padding: 8px 20px;
                        border-radius: 99px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: rgba(255, 255, 255, 0.03);
                        color: var(--secondary-text);
                        font-weight: 700;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .filter-btn:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .filter-btn.active {
                        background: linear-gradient(135deg, var(--accent-color), #6366f1);
                        color: #fff;
                        border-color: transparent;
                        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
                    }

                    @media (max-width: 768px) {
                        .home-feed-container {
                            padding: 12px 12px 80px;
                        }

                        .search-row {
                            flex-direction: column;
                            gap: 10px;
                        }

                        .sort-select {
                            width: 100%;
                            min-width: 0;
                            height: 48px;
                        }

                        .filter-btn {
                            padding: 8px 16px;
                            font-size: 12px;
                        }
                        
                        .section-header {
                            background: rgba(15, 13, 21, 0.4);
                            padding: 16px;
                            margin: -12px -12px 20px;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                            backdrop-filter: blur(10px);
                        }
                    }
                `}</style>

                {/* Grade de Vídeos */}
                {loading && videos.length === 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {[...Array(8)].map((_, i) => (
                            <SkeletonVideoCard key={i} />
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg)', borderRadius: '24px', color: 'var(--secondary-text)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏜️</div>
                        <h3 style={{ fontSize: '24px', color: 'var(--text-color)', margin: '0 0 8px' }}>Nada por aqui ainda</h3>
                        <p style={{ fontSize: '16px', margin: 0 }}>Seja o primeiro a compartilhar algo legal em Sinop!</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                            {sortedVideos.map((v) => (
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

                        {hasMore && (
                            <div
                                ref={loadMoreRef}
                                style={{
                                    textAlign: 'center',
                                    marginTop: '48px',
                                    padding: '24px',
                                    color: 'var(--accent-color)',
                                    fontWeight: '700'
                                }}
                            >
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '10px' }}>⏳</span>
                                Carregando mais descobertas...
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
}
