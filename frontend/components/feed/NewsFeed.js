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
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {news.map((item, index) => (
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
                                color: 'var(--text-color)',
                                position: 'relative'
                            }}
                        >
                            <div style={{ height: 180, width: '100%', overflow: 'hidden', background: '#000' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    loading="lazy"
                                />
                            </div>
                            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 11, color: 'var(--accent-color)', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {new Date(item.pubDate).toLocaleDateString('pt-BR')} • {item.source}
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
