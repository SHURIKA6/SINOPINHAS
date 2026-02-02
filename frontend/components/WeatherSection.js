import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const sp = { n: '4px', m: '8px', s: '12px', r: '16px', l: '20px' };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const fetchRealData = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
                const res = await fetch(`${apiBase}/api/weather`);
                const data = await res.json();
                if (data.error) return;
                setRealData(data);

                // Aplicar tema dinâmico baseado no clima
                const desc = data.description?.toLowerCase() || '';
                let theme = 'clear';
                if (desc.includes('rain') || desc.includes('drizzle')) theme = 'rain';
                if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('nublado')) theme = 'cloudy';
                if (desc.includes('storm') || desc.includes('thunder')) theme = 'storm';

                document.documentElement.setAttribute('data-weather', theme);
            } catch (error) { }
        };

        fetchRealData();

        // Carrega o widget externo
        const script = document.createElement('script');
        script.src = 'https://weatherwidget.io/js/widget.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            window.removeEventListener('resize', checkMobile);
            clearInterval(timer);
            document.documentElement.removeAttribute('data-weather'); // Limpa o tema
        };
    }, []);

    const translate = (val) => {
        const map = {
            'clear sky': 'Céu limpo', 'partly cloudy': 'Parcialmente nublado', 'cloudy': 'Nublado',
            'overcast': 'Encoberto', 'light rain': 'Chuva fraca', 'moderate rain': 'Chuva moderada',
            'thunderstorm': 'Tempestade', 'rain': 'Chuva', 'clear': 'Limpo', 'fog': 'Nublado'
        };
        return map[val?.toLowerCase()] || val;
    };

    return (
        <div style={{ position: 'relative', width: '100%', paddingBottom: 60 }}>
            {/* Background contextual dinâmico */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'var(--weather-overlay)',
                pointerEvents: 'none', zIndex: -1,
                transition: 'all 2s ease'
            }} />

            <div className="weather-header">
                <h2 className="weather-title">SINOPINHAS WEATHER</h2>
                <p style={{ color: 'var(--secondary-text)', fontWeight: 700 }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div className="weather-grid">
                {/* Card do Relógio Digital */}
                <div style={{
                    padding: '40px 32px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 280
                }} className="vista-glass-widget card-hover">
                    <div style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #ff4d4d, #990000)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,0.4)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }} title="Gadget Close (Cosmetic)"></div>

                    <div style={{
                        fontSize: '11px',
                        color: '#444',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        marginBottom: 16,
                        textTransform: 'uppercase',
                        textShadow: '0 1px 0 rgba(255,255,255,0.8)'
                    }}>
                        Local Time (Sinop)
                    </div>
                    <div style={{
                        fontSize: isMobile ? 54 : 72,
                        fontWeight: 900,
                        fontFamily: 'Segoe UI, Tahoma, sans-serif',
                        lineHeight: 1,
                        background: 'linear-gradient(180deg, #333 0%, #000 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 0px rgba(255,255,255,0.5))'
                    }}>
                        {currentTime.toLocaleTimeString('pt-BR', { hour12: false })}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0047AB',
                        marginTop: 8,
                        textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                    }}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </div>
                </div>

                {/* Widget Detalhado */}
                <div style={{ padding: 24 }} className="vista-glass-widget card-hover">
                    <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-label_1="SINOP" data-label_2="MATO GROSSO" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="#003366">SINOP WEATHER</a>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="vista-tile" style={{ padding: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#555', fontWeight: 800 }}>VENTO</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#002244', textShadow: '0 1px 0 white' }}>{realData?.wind_speedy || '--'}</div>
                        </div>
                        <div className="vista-tile" style={{ padding: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#555', fontWeight: 800 }}>NASCEU</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#002244', textShadow: '0 1px 0 white' }}>{realData?.sunrise || '--'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .weather-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .weather-title {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    color: white;
                    text-shadow: 0 0 10px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.5);
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    letter-spacing: 1px;
                }
                .weather-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                    padding: 0 16px;
                }
                @media (max-width: 768px) {
                    .weather-title {
                        font-size: 24px;
                    }
                    .weather-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
}


