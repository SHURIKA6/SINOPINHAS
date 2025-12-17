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
                        <div key={i} style={{ height: 300, background: 'var(--input-bg)', borderRadius: 16, animation: 'pulse 1.5s infinite' }}></div>
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
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                background: 'var(--card-bg)',
                                borderRadius: 16,
                                overflow: 'hidden',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.3s ease',
                                height: '100%',
                                color: 'var(--text-color)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ height: 180, width: '100%', overflow: 'hidden', background: '#000' }}>
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevent infinite loop
                                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22300%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A24pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22300%22%20height%3D%22180%22%20fill%3D%22%23252525%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2295%22%20y%3D%22100%22%3ENews%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                                    }}
                                />
                            </div>
                            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 12, color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: 6 }}>
                                    {new Date(item.pubDate).toLocaleDateString()} • {item.source}
                                </span>
                                <h3 style={{ margin: '0 0 10px', fontSize: 18, lineHeight: 1.4, color: 'var(--text-color)' }}>{item.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--secondary-text)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
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
