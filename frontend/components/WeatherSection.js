import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // ESCALA DE ESPAÇAMENTO CONSISTENTE (8pt Bridge)
    // 4px, 8px, 12px, 16px, 24px, 32px
    const space = {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px'
    };

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
            padding: `${space.sm} 0`,
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
                    radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.05) 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.05) 0%, transparent 60%)
                `,
                filter: 'blur(100px)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '960px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? space.md : space.lg,
                padding: `0 ${space.lg}`
            }}>

                {/* Titulo Centralizado Ultra Compacto */}
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: isMobile ? '24px' : '42px',
                        fontWeight: '1000',
                        margin: 0,
                        background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1.5px',
                        textTransform: 'uppercase',
                        lineHeight: 1
                    }}>
                        SINOPINHAS WEATHER
                    </h2>
                    <div style={{
                        marginTop: space.xs,
                        fontSize: isMobile ? '11px' : '14px',
                        color: 'var(--secondary-text)',
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        opacity: 0.7
                    }}>
                        {formatDate()}
                    </div>
                </div>

                {/* Dashboard Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: space.sm,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <div style={{
                        fontSize: isMobile ? '48px' : '68px',
                        fontWeight: '1000',
                        lineHeight: 0.85,
                        background: 'linear-gradient(to bottom, var(--text-color), var(--accent-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {realData ? `${realData.temp}°C` : '--°C'}
                    </div>
                    <div>
                        <div style={{
                            fontSize: isMobile ? '16px' : '22px',
                            color: 'var(--text-color)',
                            fontWeight: '800',
                            opacity: 0.9,
                            textTransform: 'capitalize'
                        }}>
                            {realData ? translate(realData.description) : 'Carregando...'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: '700' }}>Sinop, MT</div>
                    </div>
                </div>

                {/* Grid Deck */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: isMobile ? space.md : space.lg,
                    width: '100%',
                    alignItems: 'stretch'
                }}>

                    {/* Left: Current Conditions */}
                    <div style={{
                        background: 'var(--card-bg)',
                        backdropFilter: 'blur(30px)',
                        borderRadius: space.lg,
                        border: '1px solid var(--border-color)',
                        padding: space.lg,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: space.md,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                                <div style={{ fontSize: '20px', background: 'rgba(252, 211, 77, 0.1)', padding: space.sm, borderRadius: '10px' }}>☀️</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>Tempo Real</h3>
                                    <span style={{ fontSize: '10px', color: 'var(--secondary-text)', fontWeight: '600' }}>Sinop agora</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '9px', color: '#4ade80', fontWeight: '900', background: 'rgba(74, 222, 128, 0.05)', padding: '2px 8px', borderRadius: '4px', border: '0.5px solid rgba(74, 222, 128, 0.2)' }}>ON</span>
                        </div>

                        {/* Widget Mini */}
                        <div style={{ borderRadius: '12px', overflow: 'hidden', minHeight: '110px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                            <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Current" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" >SINOP AGORA</a>
                        </div>

                        {/* Technical Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.sm }}>
                            <DetailBlock icon="🌬️" label="Vento" value={realData ? realData.wind_speedy : '--'} />
                            <DetailBlock icon="💧" label="Umidade" value={realData ? `${realData.humidity}%` : '--'} />
                            <DetailBlock icon="☁️" label="Condição" value={realData ? translate(realData.description) : '--'} />
                            <DetailBlock icon="🕒" label="Medição" value={realData ? (realData.time || '--') : '--'} />
                        </div>
                    </div>

                    {/* Right: Trend & Astro */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: space.lg }}>
                        {/* Weekly Forecast */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: space.lg,
                            border: '1px solid var(--border-color)',
                            padding: space.lg,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: space.md
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                                <div style={{ fontSize: '20px', background: 'rgba(59, 130, 246, 0.1)', padding: space.sm, borderRadius: '10px' }}>📅</div>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>Tendência de 7 dias</h3>
                            </div>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', minHeight: '140px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', flex: 1 }}>
                                <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-mode="Forecast" data-days="7" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)" style={{ height: '100%' }}>SINOP 7 DIAS</a>
                            </div>
                        </div>

                        {/* Astronomy Row */}
                        <div style={{
                            background: 'var(--card-bg)',
                            borderRadius: space.lg,
                            border: '1px solid var(--border-color)',
                            padding: `${space.sm} ${space.md}`,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: space.sm
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
        <div style={{ background: 'var(--input-bg)', padding: '8px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '8.5px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 900, display: 'block', letterSpacing: 0.2 }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: '1000', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}

function AstroBlock({ icon, label, value }) {
    return (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <div>
                <span style={{ fontSize: '8.5px', color: 'var(--secondary-text)', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>{label}</span>
                <span style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-color)' }}>{value}</span>
            </div>
        </div>
    );
}
