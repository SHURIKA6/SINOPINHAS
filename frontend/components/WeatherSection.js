import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    const sp = { n: '4px', m: '8px', s: '12px', r: '16px', l: '20px' };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const fetchRealData = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
                const res = await fetch(`${apiBase}/api/weather`);
                const data = await res.json();
                if (data.error) return;
                setRealData(data);

                // Aplicar tema dinâmico baseado no clima
                const desc = data.description.toLowerCase();
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
            document.documentElement.removeAttribute('data-weather'); // Cleanup theme
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

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ fontSize: 32, fontWeight: 1000, margin: 0, background: 'linear-gradient(90deg, #8d6aff, #fe7d45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                    SINOPINHAS WEATHER
                </h2>
                <p style={{ color: 'var(--secondary-text)', fontWeight: 700 }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, padding: '0 16px' }}>
                {/* Card Principal */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 24, padding: 32, border: '1px solid var(--border-color)', textAlign: 'center' }} className="card-hover">
                    <div style={{ fontSize: 64, marginBottom: 16 }}>
                        {realData?.description.toLowerCase().includes('rain') ? '🌧️' :
                            realData?.description.toLowerCase().includes('cloud') ? '☁️' : '☀️'}
                    </div>
                    <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>{realData ? `${realData.temp}°` : '--°'}</div>
                    <div style={{ fontSize: 20, color: 'var(--text-color)', fontWeight: 700, margin: '16px 0 4px' }}>{realData ? translate(realData.description) : '...'}</div>
                    <div style={{ fontSize: 13, color: 'var(--secondary-text)' }}>Sensação: {realData ? `${realData.temp}°` : '--'} • Humidade: {realData?.humidity}%</div>
                </div>

                {/* Widget Detalhado */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 24, padding: 24, border: '1px solid var(--border-color)' }} className="card-hover">
                    <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-label_1="SINOP" data-label_2="MATO GROSSO" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)">SINOP WEATHER</a>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--secondary-text)', fontWeight: 800 }}>VENTO</div>
                            <div style={{ fontSize: 16, fontWeight: 900 }}>{realData?.wind_speedy || '--'}</div>
                        </div>
                        <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: 'var(--secondary-text)', fontWeight: 800 }}>NASCEU</div>
                            <div style={{ fontSize: 16, fontWeight: 900 }}>{realData?.sunrise || '--'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
