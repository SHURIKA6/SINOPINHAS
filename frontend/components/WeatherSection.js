import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // ESCALA DE ESPAÇAMENTO PADRONIZADA (BASE 4)
    const sp = {
        n: '4px',  // nano
        m: '8px',  // micro
        s: '12px', // small
        r: '16px', // regular
        l: '20px'  // large
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
                const apiBase =
                    process.env.NEXT_PUBLIC_API_URL ||
                    'https://backend.fernandoriaddasilvaribeiro.workers.dev';
                const res = await fetch(`${apiBase}/api/weather`);
                const data = await res.json();
                if (data.error) return;
                setRealData(data);
            } catch (error) {
                console.error('Failed to fetch weather data', error);
            }
        };

        fetchRealData();
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const translate = (val) => {
        if (!val) return val;
        const map = {
            'light drizzle': 'Garoa leve',
            drizzle: 'Garoa',
            'clear sky': 'Céu limpo',
            'mainly clear': 'Predom. limpo',
            'partly cloudy': 'Parc. nublado',
            cloudy: 'Nublado',
            overcast: 'Encoberto',
            fog: 'Nevoeiro',
            'light rain': 'Chuva fraca',
            'moderate rain': 'Chuva mod.',
            'heavy rain': 'Chuva forte',
            'scattered clouds': 'Nuvens esparsas',
            'broken clouds': 'Nublado',
            'few clouds': 'Poucas nuvens',
            thunderstorm: 'Tempestade'
        };
        const low = val.toLowerCase();
        return map[low] || val;
    };

    const formatDate = () => {
        const d = new Date();
        return d.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                padding: isMobile ? `${sp.m} 0 ${sp.r}` : `${sp.m} 0 ${sp.l}`,
                color: 'var(--text-color)',
                position: 'relative',
                fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `
            radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.06) 0%, transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 60%)
          `,
                    filter: 'blur(120px)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '820px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? sp.m : sp.s,
                    padding: isMobile ? `0 ${sp.m}` : `0 ${sp.s}`
                }}
            >
                {/* Título Compacto */}
                <div style={{ textAlign: 'center', marginBottom: sp.n }}>
                    <h2
                        style={{
                            fontSize: isMobile ? '24px' : '36px',
                            fontWeight: 1000,
                            margin: 0,
                            lineHeight: 1,
                            background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-1px',
                            textTransform: 'uppercase'
                        }}
                    >
                        SINOPINHAS WEATHER
                    </h2>
                    <div
                        style={{
                            marginTop: '2px',
                            fontSize: isMobile ? '11px' : '13px',
                            color: 'var(--secondary-text)',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            opacity: 0.7
                        }}
                    >
                        {formatDate()}
                    </div>
                </div>

                {/* Header Principal Compacto */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: sp.n,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0
                    }}
                >
                    <div
                        style={{
                            fontSize: isMobile ? '48px' : '64px',
                            fontWeight: 1000,
                            lineHeight: 0.85,
                            background:
                                'linear-gradient(to bottom, var(--text-color), var(--accent-color))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: sp.n
                        }}
                    >
                        {realData ? `${realData.temp}°C` : '--°C'}
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: isMobile ? '16px' : '20px',
                                color: 'var(--text-color)',
                                fontWeight: 800,
                                opacity: 0.9,
                                textTransform: 'capitalize'
                            }}
                        >
                            {realData ? translate(realData.description) : 'Sincronizando...'}
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: 'var(--secondary-text)',
                                fontWeight: 700,
                                marginTop: '1px'
                            }}
                        >
                            Sinop, MT
                        </div>
                    </div>
                </div>

                {/* Grid Dashboard */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: isMobile ? sp.m : sp.s,
                        width: '100%',
                        alignItems: 'stretch'
                    }}
                >
                    {/* CARD AGORA */}
                    <div
                        style={{
                            background:
                                'linear-gradient(145deg, rgba(20,20,30,0.4), rgba(15,15,25,0.4))',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            padding: sp.s,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: sp.m,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: sp.m
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '18px',
                                        background: 'rgba(252, 211, 77, 0.1)',
                                        padding: '5px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    ☀️
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            fontWeight: 900
                                        }}
                                    >
                                        Agora
                                    </h3>
                                    <span
                                        style={{
                                            fontSize: '9px',
                                            color: 'var(--secondary-text)'
                                        }}
                                    >
                                        Sinop tempo real
                                    </span>
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '8px',
                                    color: '#4ade80',
                                    fontWeight: 950,
                                    background: 'rgba(74, 222, 128, 0.05)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(74, 222, 128, 0.1)'
                                }}
                            >
                                LIVE
                            </span>
                        </div>

                        {/* Widget Mini */}
                        <div
                            style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                minHeight: '80px',
                                background: 'rgba(0,0,0,0.1)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <a
                                className="weatherwidget-io"
                                href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                                data-mode="Current"
                                data-theme="weather_one"
                                data-basecolor="rgba(0,0,0,0)"
                                data-textcolor="var(--text-color)"
                            >
                                SINOP AGORA
                            </a>
                        </div>

                        {/* Detalhes Dashboard */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: sp.n
                            }}
                        >
                            <DetailBlock
                                icon="🌬️"
                                label="Vento"
                                value={realData ? realData.wind_speedy : '--'}
                            />
                            <DetailBlock
                                icon="💧"
                                label="Humi"
                                value={realData ? `${realData.humidity}%` : '--'}
                            />
                            <DetailBlock
                                icon="☁️"
                                label="Clima"
                                value={realData ? translate(realData.description) : '--'}
                            />
                            <DetailBlock
                                icon="🕒"
                                label="Hora"
                                value={
                                    realData
                                        ? realData.time || '--'
                                        : '--'
                                }
                            />
                        </div>
                    </div>

                    {/* COLUNA DIREITA */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: sp.s
                        }}
                    >
                        {/* Previsão Semanal */}
                        <div
                            style={{
                                background:
                                    'linear-gradient(145deg, rgba(20,20,30,0.4), rgba(15,15,25,0.4))',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                padding: sp.s,
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: sp.m,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: sp.m
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '18px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        padding: '5px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    📅
                                </div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: 900
                                    }}
                                >
                                    Próximos 7 dias
                                </h3>
                            </div>
                            <div
                                style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    minHeight: '120px',
                                    background: 'rgba(0,0,0,0.1)',
                                    border: '1px solid var(--border-color)',
                                    flex: 1
                                }}
                            >
                                <a
                                    className="weatherwidget-io"
                                    href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                                    data-mode="Forecast"
                                    data-days="7"
                                    data-theme="weather_one"
                                    data-basecolor="rgba(0,0,0,0)"
                                    data-textcolor="var(--text-color)"
                                    style={{ height: '100%' }}
                                >
                                    SINOP 7 DIAS
                                </a>
                            </div>
                        </div>

                        {/* Astronomia */}
                        <div
                            style={{
                                background:
                                    'linear-gradient(145deg, rgba(20,20,30,0.4), rgba(15,15,25,0.4))',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                padding: `${sp.m} ${sp.s}`,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: sp.n,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <AstroBlock
                                icon="🌅"
                                label="Nascer"
                                value={realData ? realData.sunrise : '--'}
                            />
                            <AstroBlock
                                icon="🌇"
                                label="Ocaso"
                                value={realData ? realData.sunset : '--'}
                            />
                            <AstroBlock
                                icon="🌑"
                                label="Lua"
                                value={realData ? realData.moon_phase : 'N/A'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailBlock({ icon, label, value }) {
    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '6px 2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
            }}
        >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            <div style={{ textAlign: 'center' }}>
                <span
                    style={{
                        fontSize: '7.5px',
                        color: 'var(--secondary-text)',
                        textTransform: 'uppercase',
                        fontWeight: 900,
                        display: 'block',
                        letterSpacing: 0.2
                    }}
                >
                    {label}
                </span>
                <span
                    style={{ fontSize: '11px', fontWeight: 1000, color: 'var(--text-color)' }}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}

function AstroBlock({ icon, label, value }) {
    return (
        <div
            style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px'
            }}
        >
            <span style={{ fontSize: '15px' }}>{icon}</span>
            <div>
                <span
                    style={{
                        fontSize: '7.5px',
                        color: 'var(--secondary-text)',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        display: 'block'
                    }}
                >
                    {label}
                </span>
                <span
                    style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-color)' }}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}
