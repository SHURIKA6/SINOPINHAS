import Head from 'next/head';
import { useRouter } from 'next/router';
import { useFavorites } from '../hooks/useFavorites';

export default function Offline() {
    const { favorites } = useFavorites();
    const router = useRouter();

    const hasFavorites = favorites.videos.length > 0 || favorites.news.length > 0 || favorites.events.length > 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            padding: '40px 20px',
            textAlign: 'center',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <Head>
                <title>Offline | SINOPINHAS</title>
            </Head>

            <div style={{ fontSize: '80px', marginBottom: '20px' }}>📡</div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>Você está Offline</h1>
            <p style={{ color: 'var(--secondary-text)', maxWidth: '400px', margin: '0 auto 40px' }}>
                Parece que sua conexão com a internet caiu. Mas não se preocupe, você ainda pode acessar seus itens salvos!
            </p>

            {hasFavorites ? (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
                        Conteúdo Salvo
                    </h2>

                    {favorites.news.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '14px', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '12px' }}>Notícias</h3>
                            {favorites.news.map((item, i) => (
                                <div key={i} style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {favorites.events.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '14px', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '12px' }}>Eventos</h3>
                            {favorites.events.map((item, i) => (
                                <div key={i} style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>{item.date} • {item.location}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '40px', background: 'var(--card-bg)', borderRadius: '24px', maxWidth: '400px', margin: '0 auto' }}>
                    <p style={{ margin: 0 }}>Você ainda não salvou nenhum conteúdo para ver offline.</p>
                </div>
            )}

            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: '40px',
                    padding: '16px 32px',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '16px',
                    fontWeight: 800,
                    cursor: 'pointer'
                }}
            >
                Tentar reconectar
            </button>
        </div>
    );
}
