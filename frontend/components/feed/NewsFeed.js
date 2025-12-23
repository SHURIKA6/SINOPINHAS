import { useState, useEffect, useMemo } from 'react';
import { fetchNews } from '../../services/api';
import { useFavorites } from '../../hooks/useFavorites';
import { Search, Newspaper, Star } from 'lucide-react';

export default function NewsFeed() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        try {
            const data = await fetchNews();
            setNews(data);
        } catch (err) {
            console.error("Erro ao carregar notícias:", err);
            setError("Não foi possível carregar as notícias no momento.");
        } finally {
            setLoading(false);
        }
    };

    const filteredNews = useMemo(() => {
        if (!searchQuery.trim()) return news;
        const q = searchQuery.toLowerCase();
        return news.filter(item =>
            (item.title?.toLowerCase() || '').includes(q) ||
            (item.description?.toLowerCase() || '').includes(q)
        );
    }, [news, searchQuery]);

    const handleToggleFavorite = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite('news', item);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    return (
        <div className="news-container">
            {/* Premium Header */}
            <div className="news-header-box">
                <div className="title-row">
                    <div className="icon-badge">
                        <Newspaper size={20} color="#a855f7" />
                    </div>
                    <h2 className="premium-title">Jornal Sinop</h2>
                </div>
                <div className="news-search-wrapper">
                    <Search size={18} className="search-icon-lucide" />
                    <input
                        type="text"
                        placeholder="O que está acontecendo em Sinop?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="news-search-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="news-loading-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-news-card" />
                    ))}
                </div>
            ) : error ? (
                <div className="news-error-box">
                    <h3>{error}</h3>
                    <button onClick={loadNews} className="retry-btn">Tentar Novamente</button>
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="news-empty-box">
                    <div className="empty-icon">🧐</div>
                    <p>Nenhuma notícia encontrada para sua busca.</p>
                </div>
            ) : (
                <div className="news-feed-grid">
                    {filteredNews.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-feed-card"
                        >
                            <div className="n-img-wrapper">
                                <img src={item.image} alt="" className="n-img" loading="lazy" />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, item)}
                                    className={`n-fav-btn ${isFavorite('news', item) ? 'is-fav' : ''}`}
                                >
                                    <Star size={16} fill={isFavorite('news', item) ? "#ffca28" : "none"} />
                                </button>
                                <div className="n-source">{item.source || 'Sinop'}</div>
                            </div>
                            <div className="n-info">
                                <div className="n-meta">
                                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Hoje'}
                                </div>
                                <h3 className="n-title">{item.title}</h3>
                                <p className="n-description">{item.description}</p>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <style jsx>{`
                .news-container {
                    padding: 8px 0 100px;
                    max-width: 1100px;
                    margin: 0 auto;
                }

                .news-header-box {
                    background: rgba(25, 20, 40, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 28px;
                    padding: 24px;
                    margin-bottom: 32px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .icon-badge {
                    width: 40px;
                    height: 40px;
                    background: rgba(168, 85, 247, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .premium-title {
                    font-size: 24px;
                    font-weight: 900;
                    margin: 0;
                    background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .news-search-wrapper {
                    position: relative;
                    width: 100%;
                }

                .search-icon-lucide {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                }

                .news-search-input {
                    width: 100%;
                    padding: 14px 20px 14px 48px;
                    background: rgba(15, 13, 21, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    transition: all 0.3s ease;
                }

                .news-search-input:focus {
                    border-color: #a855f7;
                    background: rgba(15, 13, 21, 0.6);
                    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
                }

                .news-feed-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }

                .news-feed-card {
                    background: var(--card-bg);
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                    overflow: hidden;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .news-feed-card:hover {
                    transform: translateY(-6px);
                    border-color: #a855f7;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
                }

                .n-img-wrapper {
                    height: 200px;
                    position: relative;
                    overflow: hidden;
                }

                .n-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
                .news-feed-card:hover .n-img { transform: scale(1.08); }

                .n-fav-btn {
                    position: absolute; top: 12px; right: 12px;
                    width: 36px; height: 36px; border-radius: 50%;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
                    border: none; color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10;
                }
                
                .n-fav-btn.is-fav { color: #ffca28; }

                .n-source {
                    position: absolute; bottom: 12px; left: 12px;
                    background: rgba(168, 85, 247, 0.9); padding: 4px 10px;
                    border-radius: 8px; font-size: 10px; font-weight: 800; color: white;
                }

                .n-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
                .n-meta { font-size: 11px; font-weight: 800; color: #a855f7; text-transform: uppercase; margin-bottom: 8px; }
                .n-title { margin: 0 0 10px; font-size: 18px; line-height: 1.4; color: white; font-weight: 700; }
                .n-description { font-size: 14px; color: #94a3b8; margin: 0; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

                @media (max-width: 768px) {
                    .news-header-box { padding: 16px; border-radius: 20px; }
                    .premium-title { font-size: 20px; }
                    .news-feed-grid { gap: 16px; }
                    .news-feed-card { flex-direction: row; height: 130px; border-radius: 20px; }
                    .n-img-wrapper { width: 120px; height: 100%; flex-shrink: 0; }
                    .n-info { padding: 12px; justify-content: center; }
                    .n-title { font-size: 14px; margin-bottom: 4px; line-height: 1.3; -webkit-line-clamp: 2; }
                    .n-description { display: none; }
                    .n-source { font-size: 8px; padding: 2px 6px; left: 8px; bottom: 8px; }
                }

                .news-error-box, .news-empty-box {
                    padding: 80px 20px; text-align: center; color: #94a3b8;
                }
                
                .skeleton-news-card {
                    height: 300px; background: rgba(255,255,255,0.05); border-radius: 24px;
                    animation: pulse 1.5s infinite;
                }
            `}</style>
        </div>
    );
}
