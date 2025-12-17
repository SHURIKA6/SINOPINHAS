import { useState, useEffect } from 'react';
import { fetchNews } from '../../services/api';

export default function NewsFeed() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div style={{ padding: '24px 16px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
                📰 Notícias de Sinop - Só Notícias
            </h2>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{ height: 300, background: '#252525', borderRadius: 16, animation: 'pulse 1.5s infinite' }}></div>
                    ))}
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>
                    <h3>{error}</h3>
                    <button onClick={loadNews} style={{ padding: '10px 20px', marginTop: 10, cursor: 'pointer' }}>Tentar Novamente</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {news.map((item, index) => (
                        <a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#1a1a1a',
                                borderRadius: 16,
                                overflow: 'hidden',
                                border: '1px solid #303030',
                                transition: 'transform 0.2s',
                                height: '100%'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ height: 180, width: '100%', overflow: 'hidden', background: '#000' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x180?text=News'; }}
                                />
                            </div>
                            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 12, color: '#8d6aff', fontWeight: 'bold', marginBottom: 6 }}>
                                    {new Date(item.pubDate).toLocaleDateString()} • {item.source}
                                </span>
                                <h3 style={{ margin: '0 0 10px', fontSize: 18, lineHeight: 1.4 }}>{item.title}</h3>
                                <p style={{ fontSize: 14, color: '#aaa', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                    {item.description}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
