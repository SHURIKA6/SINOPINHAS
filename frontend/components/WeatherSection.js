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
            padding: isMobile ? '5px 0' : '10px 0',
            color: 'var(--text-color)',
            position: 'relative',
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
                    radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.08) 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)
                `,
                filter: 'blur(100px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '1000px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '10px' : '20px',
                padding: isMobile ? '0 10px' : '0 20px'
            }}>

                {/* Titulo Centralizado Compacto */}
                <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <h2 style={{
                        fontSize: isMobile ? '28px' : '48px',
                        fontWeight: '950',
                        margin: 0,
                        background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1.5px',
                        textTransform: 'uppercase'
                    }}>
                        SINOPINHAS WEATHER
                    </h2>
                    <div style={{
                        marginTop: 2,
                        fontSize: isMobile ? '12px' : '15px',
                        color: 'var(--secondary-text)',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        opacity: 0.8
                    }}>
                        {formatDate()}
                    </div>
                </div>

                {/* Header Principal Compacto */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0
                }}>
                    <div style={{
                        fontSize: isMobile ? '52px' : '74px',
                        fontWeight: '1000',
                        lineHeight: 0.9,
                        background: 'linear-gradient(to bottom, var(--text-color), var(--accent-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 4
                    }}>
                        {realData ? `${realData.temp}°C` : '--°C'}
                    </div>
                    <div>
                        <div style={{
                            fontSize: isMobile ? '18px' : '24px',
                            color: 'var(--text-color)',
                            fontWeight: '800',
                            opacity: 0.95,
                            textTransform: 'capitalize'
                        }}>
                            {realData ? translate(realData.description) : 'Carregando...'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--secondary-text)', fontWeight: '700', marginTop: 2 }}>Sinop, MT</div>
                    </div>
                </div>

                {/* Grid Ultra Compacto */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: isMobile ? '12px' : '20px',
                    width: '100%',
                    alignItems: 'stretch'
                }}>

                    {/* CARD AGORA - REDUZIDO */}
                    <div style={{
                        background: 'var(--card-bg)',
                        backdropFilter: 'blur(30px)',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        padding: isMobile ? '15px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '22px', background: 'rgba(252, 211, 77, 0.15)', padding: 8, borderRadius: 12 }}>☀️</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Sinop Agora</h3>
                                    <span style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>Dados em tempo real</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 'bold', background: 'rgba(74, 222, 128, 0.08)', padding: '4px 10px', borderRadius: 20 }}>ONLINE</span>
                        </div>

                        {/* Widget Mini - Altura Inteligente */}
                        <div style={{ borderRadius: '14px', overflow: 'hidden', minHeight: '120px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                            <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Current" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" >SINOP AGORA</a>
                        </div>

                        {/* Detalhes Técnicos Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <DetailBlock icon="🌬️" label="Vento" value={realData ? realData.wind_speedy : '--'} />
                            <DetailBlock icon="💧" label="Umidade" value={realData ? `${realData.humidity}%` : '--'} />
                            <DetailBlock icon="☁️" label="Condição" value={realData ? translate(realData.description) : '--'} />
                            <DetailBlock icon="🕒" label="Horário" value={realData ? (realData.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })) : '--'} />
                        </div>
                    </div>

                    {/* COLUNA DIREITA - REDUZIDA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Previsão Semanal */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            padding: isMobile ? '15px' : '20px',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ fontSize: '22px', background: 'rgba(59, 130, 246, 0.15)', padding: 8, borderRadius: 12 }}>📅</div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Tendência Semanal</h3>
                            </div>
                            <div style={{ borderRadius: '14px', overflow: 'hidden', minHeight: '180px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', flex: 1 }}>
                                <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Forecast" data-days="7" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" style={{ height: '100%' }}>SINOP 7 DIAS</a>
                            </div>
                        </div>

                        {/* Astronomia Compacta */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            padding: '12px 15px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px'
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
        <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '9px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 800, display: 'block', letterSpacing: 0.3 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}

function AstroBlock({ icon, label, value }) {
    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div>
                <span style={{ fontSize: '9px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}
