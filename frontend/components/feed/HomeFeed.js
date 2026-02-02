import { useState, useEffect, useMemo, useRef } from 'react';
import VideoCard from '../VideoCard';
import FeedSkeleton from './FeedSkeleton';
import ShareModal from '../ShareModal';
import { fetchVideos, searchVideos, likeVideo, removeVideo } from '../../services/api';
import { Search, Flame, Video, Image as ImageIcon } from 'lucide-react';

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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadMoreRef = useRef(null);
    const [videoToShare, setVideoToShare] = useState(null);

    const sortedVideos = useMemo(() => {
        let list = [...videos];
        if (sortBy === 'popular') list.sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0));
        else if (sortBy === 'liked') list.sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [videos, sortBy]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                setOffset(prev => prev + LIMIT);
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        loadVideos(0, true);
    }, [debouncedSearchQuery, sortBy, filterType]);

    useEffect(() => {
        if (offset > 0) {
            loadVideos(offset, false);
        }
    }, [offset]);

    const loadVideos = async (currentOffset, reset = false) => {
        if (reset) setLoading(true);
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
            showToast('Erro ao excluir', 'error');
        }
    };

    return (
        <div className="home-feed-root">
            {hearts.map(h => (
                <div key={h.id} className="floating-heart" style={{ left: h.x, top: h.y }}>❤️</div>
            ))}

            <div className="home-feed-container">
                {/* Premium Search & Filter Header */}
                <div className="feed-header-glass">
                    <div className="search-row-feed">
                        <div className="feed-search-input-box">
                            <Search size={18} className="search-f-icon" />
                            <input
                                type="text"
                                placeholder="O que você quer ver hoje em Sinop?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="feed-sort-select"
                        >
                            <option value="recent">🕒 Recentes</option>
                            <option value="popular">🔥 Populares</option>
                            <option value="liked">❤️ Curtidos</option>
                        </select>
                    </div>

                    <div className="feed-filter-tabs">
                        {[
                            { id: 'all', label: 'Todos', icon: <Flame size={14} /> },
                            { id: 'video', label: 'Vídeos', icon: <Video size={14} /> },
                            { id: 'photo', label: 'Fotos', icon: <ImageIcon size={14} /> }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setFilterType(type.id)}
                                className={`feed-filter-btn ${filterType === type.id ? 'active' : ''}`}
                            >
                                {type.icon}
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading && videos.length === 0 ? (
                    <div className="feed-grid">
                        {[...Array(8)].map((_, i) => <FeedSkeleton key={i} />)}
                    </div>
                ) : videos.length === 0 ? (
                    <div className="feed-empty">
                        <div className="empty-emoji">🏜️</div>
                        <h3>Nada por aqui ainda</h3>
                        <p>Seja o primeiro a compartilhar algo legal em Sinop!</p>
                    </div>
                ) : (
                    <div className="feed-grid">
                        {videos.map(v => (
                            <VideoCard
                                key={v.id}
                                video={v}
                                onDelete={handleDeleteVideo}
                                onLike={toggleLike}
                                onOpenComments={onVideoClick}
                                canDelete={canDelete ? canDelete(v.user_id?.toString()) : (isAdmin || (user && user.id.toString() === v.user_id?.toString()))}
                                onShare={(video) => setVideoToShare(video)}
                            />
                        ))}
                        {hasMore && <div ref={loadMoreRef} className="feed-loader">Carregando mais...</div>}
                    </div>
                )}
            </div>

            <style jsx>{`
                .home-feed-root { position: relative; }
                .home-feed-container { max-width: 1200px; margin: 0 auto; padding: 0 0 100px; }
                
                .feed-header-glass {
                    background: rgba(25, 20, 40, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 32px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .search-row-feed { display: flex; gap: 12px; margin-bottom: 20px; }
                
                .feed-search-input-box {
                    flex: 1; position: relative;
                }

                .search-f-icon {
                    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                }

                .feed-search-input-box input {
                    width: 100%; padding: 14px 20px 14px 48px;
                    background: rgba(15, 13, 21, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px; color: white; font-size: 15px; outline: none;
                }

                .feed-sort-select {
                    padding: 12px 16px; background: rgba(15, 13, 21, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px; color: white; font-size: 14px; font-weight: 600; cursor: pointer;
                }

                .feed-filter-tabs { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
                .feed-filter-tabs::-webkit-scrollbar { display: none; }

                .feed-filter-btn {
                    padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03); color: #94a3b8; font-weight: 700;
                    font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    white-space: nowrap; transition: all 0.2s ease;
                }

                .feed-filter-btn.active {
                    background: linear-gradient(135deg, #a855f7, #6366f1);
                    color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
                }

                .feed-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;
                }

                .floating-heart {
                    position: fixed; pointer-events: none; z-index: 10001; font-size: 24px;
                    animation: floatHeart 1s ease-out forwards;
                }

                .feed-empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
                .empty-emoji { font-size: 64px; margin-bottom: 24px; }
                
                .feed-loader {
                    text-align: center; margin-top: 48px; padding: 24px; color: #a855f7; font-weight: 700;
                }

                @media (max-width: 768px) {
                    .feed-header-glass { padding: 16px; border-radius: 20px; margin: 0 0 20px; }
                    .search-row-feed { flex-direction: column; }
                    .feed-sort-select { width: 100%; height: 48px; }
                    .feed-search-input-box input { height: 48px; }
                    .feed-filter-btn { padding: 6px 14px; font-size: 12px; }
                }

                @keyframes floatHeart {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
