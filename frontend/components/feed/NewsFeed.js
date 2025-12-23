import { useState, useEffect, useMemo } from 'react';
import { fetchNews } from '../../services/api';
import { useFavorites } from '../../hooks/useFavorites';

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
        <div style={{ padding: '0px 0px 48px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

            {/* Search Header */}
            <div className="section-header">
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px', color: 'var(--text-color)' }}>
                    📰 Jornal Sinop
                </h2>
                <div className="search-wrapper">
                    <span className="icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Pesquisar notícias de Sinop..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input-global"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 320, background: 'var(--card-bg)', borderRadius: 24, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <div className="skeleton" style={{ height: 180, width: '100%' }} />
                            <div style={{ padding: 16 }}>
                                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 16 }} />
                                <div className="skeleton" style={{ height: 18, width: '90%', marginBottom: 8 }} />
                                <div className="skeleton" style={{ height: 18, width: '60%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>
                    <h3>{error}</h3>
                    <button onClick={loadNews} style={{ padding: '10px 20px', marginTop: 10, cursor: 'pointer', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: 8 }}>Tentar Novamente</button>
                </div>
            ) : filteredNews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--secondary-text)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧐</div>
                    <p>Nenhuma notícia encontrada para sua busca.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {filteredNews.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-hover"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--card-bg)',
                                borderRadius: 24,
                                overflow: 'hidden',
                                border: '1px solid var(--border-color)',
                                height: '100%',
                                position: 'relative'
                            }}
                        >
                            <div style={{ height: 180, width: '100%', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    loading="lazy"
                                />
                                <button
                                    onClick={(e) => handleToggleFavorite(e, item)}
                                    style={{
                                        position: 'absolute', top: 12, right: 12,
                                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                        border: 'none', borderRadius: '50%', width: 36, height: 36,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', fontSize: 16, zIndex: 10
                                    }}
                                >
                                    {isFavorite('news', item) ? '⭐' : '☆'}
                                </button>
                            </div>
                            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 11, color: 'var(--accent-color)', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase' }}>
                                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString('pt-BR') : '--/--/----'} • {item.source}
                                </span>
                                <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-color)' }}>{item.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--secondary-text)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                    {item.description}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
