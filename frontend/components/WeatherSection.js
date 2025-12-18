import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const loadWidget = () => {
            const id = 'weatherwidget-io-js';
            const existingScript = document.getElementById(id);
            if (existingScript) existingScript.remove();

            const script = document.createElement('script');
            script.id = id;
            script.src = 'https://weatherwidget.io/js/widget.min.js';
            script.async = true;
            document.body.appendChild(script);
        };
        setTimeout(loadWidget, 100);

        const fetchRealData = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
                const res = await fetch(`${apiBase}/api/weather`);
                const data = await res.json();
                if (data.error) return;
                setRealData(data);
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            }
        };

        fetchRealData();
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const translate = (val) => {
        if (!val) return val;
        const map = {
            "light drizzle": "Garoa leve",
            "drizzle": "Garoa",
            "clear sky": "Céu limpo",
            "mainly clear": "Predominantemente limpo",
            "partly cloudy": "Parcialmente nublado",
            "cloudy": "Nublado",
            "overcast": "Encoberto",
            "fog": "Nevoeiro",
            "light rain": "Chuva fraca",
            "moderate rain": "Chuva moderada",
            "heavy rain": "Chuva forte",
            "scattered clouds": "Nuvens esparsas",
            "broken clouds": "Nublado",
            "few clouds": "Poucas nuvens",
            "thunderstorm": "Tempestade"
        };
        const low = val.toLowerCase();
        return map[low] || val;
    };

    const formatDate = () => {
        const d = new Date();
        return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: isMobile ? '10px' : '20px',
            color: 'var(--text-color)',
            position: 'relative',
            minHeight: '80vh',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            overflow: 'hidden'
        }}>

            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `
                    radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.1) 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.1) 0%, transparent 60%)
                `,
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '1100px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '15px' : '30px'
            }}>

                {/* Titulo Centralizado */}
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '10px' : '20px' }}>
                    <h2 style={{
                        fontSize: isMobile ? '32px' : '64px',
                        fontWeight: '900',
                        margin: 0,
                        background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 4px 15px rgba(141, 106, 255, 0.2)',
                        letterSpacing: '-2px',
                        textTransform: 'uppercase'
                    }}>
                        SINOPINHAS WEATHER
                    </h2>
                    <div style={{
                        marginTop: 10,
                        fontSize: isMobile ? '14px' : '18px',
                        color: 'var(--secondary-text)',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                    }}>
                        {formatDate()}
                    </div>
                </div>

                {/* Header Section Alinhada */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    padding: '10px'
                }}>
                    <div style={{
                        fontSize: isMobile ? '48px' : '82px',
                        fontWeight: '900',
                        lineHeight: 1,
                        background: 'linear-gradient(to bottom, var(--text-color), var(--accent-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {realData ? `${realData.temp}°C` : '--°C'}
                    </div>
                    <div>
                        <div style={{
                            fontSize: isMobile ? '20px' : '28px',
                            color: 'var(--text-color)',
                            fontWeight: '700',
                            opacity: 0.9,
                            textTransform: 'capitalize'
                        }}>
                            {realData ? translate(realData.description) : 'Carregando...'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--secondary-text)', fontWeight: '600', marginTop: 4 }}>Sinop, Mato Grosso</div>
                    </div>
                </div>

                {/* Grid de Cards Principal */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: isMobile ? '15px' : '30px',
                    width: '100%',
                    alignItems: 'stretch'
                }}>

                    {/* CARD AGORA */}
                    <div style={{
                        background: 'var(--card-bg)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        padding: isMobile ? '20px' : '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '25px',
                        height: '100%'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '28px', background: 'rgba(252, 211, 77, 0.2)', padding: 12, borderRadius: 16 }}>☀️</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Agora</h3>
                                    <span style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>Condições em tempo real</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 'bold', background: 'rgba(74, 222, 128, 0.1)', padding: '6px 12px', borderRadius: 20 }}>• Online</span>
                        </div>

                        {/* Widget Mini */}
                        <div style={{ borderRadius: '20px', overflow: 'hidden', minHeight: '130px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                            <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Current" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" >SINOP AGORA</a>
                        </div>

                        {/* Dados Detalhados */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <DetailBlock icon="🌬️" label="Vento" value={realData ? realData.wind_speedy : '--'} />
                            <DetailBlock icon="💧" label="Umidade" value={realData ? `${realData.humidity}%` : '--'} />
                            <DetailBlock icon="☁️" label="Clima" value={realData ? translate(realData.description) : '--'} />
                            <DetailBlock icon="🕒" label="Atualizado" value={realData ? (realData.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })) : '--'} />
                        </div>
                    </div>

                    {/* COLUNA DIREITA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', height: '100%' }}>
                        {/* Weekly Forecast Card */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            padding: isMobile ? '20px' : '30px',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                                <div style={{ fontSize: '28px', background: 'rgba(59, 130, 246, 0.2)', padding: 12, borderRadius: 16 }}>📅</div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Próximos Dias</h3>
                            </div>
                            <div style={{ borderRadius: '20px', overflow: 'hidden', minHeight: '160px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', flex: 1 }}>
                                <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Forecast" data-days="7" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" style={{ height: '100%' }}>SINOP 7 DIAS</a>
                            </div>
                        </div>

                        {/* Astro Details */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            padding: '25px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '15px'
                        }}>
                            <AstroBlock icon="🌅" label="Nascer" value={realData ? realData.sunrise : '--'} />
                            <AstroBlock icon="🌇" label="Ocaso" value={realData ? realData.sunset : '--'} />
                            <AstroBlock icon="🌑" label="Lua" value={realData ? realData.moon_phase : 'N/A'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailBlock({ icon, label, value }) {
    return (
        <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 700, display: 'block', letterSpacing: 0.5 }}>{label}</span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}

function AstroBlock({ icon, label, value }) {
    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div>
                <span style={{ fontSize: '10px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}
