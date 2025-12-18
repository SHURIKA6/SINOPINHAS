import React, { useEffect, useState } from 'react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);

    useEffect(() => {
        // Load the visual widget script
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

        // Fetch data from OUR backend (which uses HG Brasil)
        const fetchRealData = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
                const res = await fetch(`${apiBase}/api/weather`);
                const data = await res.json();

                if (data.error) {
                    console.warn("Weather API error:", data.message);
                    return;
                }

                setRealData(data);
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            }
        };

        fetchRealData();
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '40px 20px',
            color: 'var(--text-color)',
            position: 'relative',
            background: 'transparent',
            minHeight: '80vh',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            transition: 'color 0.3s ease'
        }}>

            {/* Background com Animação Suave - Efeito Aurora */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                maxWidth: '1400px',
                background: `
                    radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.2) 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.2) 0%, transparent 60%)
                `,
                filter: 'blur(80px)',
                zIndex: 0,
                pointerEvents: 'none',
                animation: 'pulseAurora 8s ease-in-out infinite alternate'
            }} />

            {/* Container Principal */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '1100px',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px'
            }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{
                        fontSize: '64px',
                        fontWeight: '800',
                        marginBottom: '10px',
                        background: 'linear-gradient(to right, var(--text-color), var(--accent-color))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 4px 30px rgba(141, 106, 255, 0.2)',
                        letterSpacing: '-2px'
                    }}>
                        {realData ? `${realData.temp}°C` : 'Clima em Sinop'}
                    </h2>
                    <p style={{
                        fontSize: '20px',
                        color: 'var(--secondary-text)',
                        fontWeight: '500',
                        marginTop: '0'
                    }}>
                        {realData ? realData.description : 'Monitoramento climático da nossa SINOPINHA!'}
                    </p>
                </div>

                {/* Grid de Cards Principal */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '30px',
                    width: '100%',
                    alignItems: 'start'
                }}>

                    {/* LEFTSIDE: CARD HOJE */}
                    <div style={{
                        background: 'var(--card-bg)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '32px',
                        border: '1px solid var(--border-color)',
                        padding: '32px',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        transition: 'background 0.3s ease, border-color 0.3s ease'
                    }}>
                        {/* Header do Card */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    fontSize: '28px',
                                    background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(251, 191, 36, 0.2)'
                                }}>
                                    ☀️
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-color)' }}>Agora</h3>
                                    <span style={{ fontSize: '14px', color: 'var(--secondary-text)' }}>Condições atuais</span>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '12px',
                                color: '#4ade80',
                                fontWeight: 'bold',
                                background: 'rgba(74, 222, 128, 0.1)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid rgba(74, 222, 128, 0.2)'
                            }}>• Online</span>
                        </div>

                        {/* Widget Visual (Iframe) */}
                        <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '10px' }}>
                            <a
                                className="weatherwidget-io"
                                href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                                data-label_1="SINOP"
                                data-label_2="AGORA"
                                data-font="Roboto"
                                data-icons="Climacons Animated"
                                data-mode="Current"
                                data-theme="weather_one"
                                data-basecolor="rgba(0,0,0,0)"
                                data-accent="#c4b5fd"
                                data-textcolor="var(--text-color)"
                                data-highcolor="#fcd34d"
                                data-lowcolor="#94a3b8"
                            >SINOP HOJE</a>
                        </div>

                        {/* REAL DATA GRID */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                        }}>
                            <DetailBlock
                                icon="🌬️"
                                label="Vento"
                                value={realData ? realData.wind_speedy : '--'}
                                color="#60a5fa"
                            />
                            <DetailBlock
                                icon="💧"
                                label="Umidade"
                                value={realData ? `${realData.humidity}%` : '--'}
                                color="#38bdf8"
                            />
                            <DetailBlock
                                icon="☁️"
                                label="Condição"
                                value={realData ? realData.description : '--'}
                                color="#f87171"
                            />
                            <DetailBlock
                                icon="📅"
                                label="Data"
                                value={realData ? realData.date : '--'}
                                subValue={realData ? realData.time : ''}
                                color="#a78bfa"
                            />
                        </div>
                    </div>

                    {/* RIGHTSIDE: PREVISÃO & ASTRONOMIA */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '30px'
                    }}>
                        {/* Weekly Forecast Card */}
                        <div style={{
                            background: 'var(--card-bg)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '32px',
                            border: '1px solid var(--border-color)',
                            padding: '32px',
                            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                            transition: 'background 0.3s ease, border-color 0.3s ease'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginBottom: '24px',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '20px'
                            }}>
                                <div style={{
                                    fontSize: '28px',
                                    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
                                }}>
                                    📅
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-color)' }}>Previsão 7 Dias</h3>
                                    <span style={{ fontSize: '14px', color: 'var(--secondary-text)' }}>Tendência da semana</span>
                                </div>
                            </div>

                            <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
                                <a
                                    className="weatherwidget-io"
                                    href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                                    data-label_1="SINOP"
                                    data-label_2="7 DIAS"
                                    data-font="Roboto"
                                    data-icons="Climacons Animated"
                                    data-mode="Forecast"
                                    data-days="7"
                                    data-theme="weather_one"
                                    data-basecolor="rgba(0,0,0,0)"
                                    data-accent="#38bdf8"
                                    data-textcolor="var(--text-color)"
                                    style={{
                                        display: 'block',
                                        height: '340px'
                                    }}
                                >SINOP FUTURO</a>
                            </div>
                        </div>

                        {/* Astronomy & UV Card (New to fill space) */}
                        <div style={{
                            background: 'var(--card-bg)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '32px',
                            border: '1px solid var(--border-color)',
                            padding: '25px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '15px',
                            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                            transition: 'background 0.3s ease, border-color 0.3s ease'
                        }}>
                            <AstroBlock
                                icon="🌅"
                                label="Nascer do Sol"
                                value={realData ? realData.sunrise : '--:--'}
                            />
                            <AstroBlock
                                icon="🌇"
                                label="Pôr do Sol"
                                value={realData ? realData.sunset : '--:--'}
                            />
                            <AstroBlock
                                icon="🌑"
                                label="Fase da Lua"
                                value={realData ? realData.moon_phase : '--'}
                            />
                        </div>

                    </div>
                </div>

            </div>


            <style jsx>{`
                @keyframes pulseAurora {
                    0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
                    100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
                }
            `}</style>
        </div>
    );
}

// Block for technical details (wind, humidity, etc)
function DetailBlock({ icon, label, value, subValue, color }) {
    return (
        <div style={{
            background: 'var(--input-bg)',
            padding: '20px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden'
        }}
            onMouseOver={e => {
                e.currentTarget.style.background = 'var(--accent-color)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = color + '40'; // add subtle color border
            }}
            onMouseOut={e => {
                e.currentTarget.style.background = 'var(--input-bg)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
        >
            <span style={{ fontSize: '28px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <span style={{ fontSize: '12px', color: 'var(--secondary-text)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-color)' }}>{value}</span>
                {subValue && <span style={{ fontSize: '11px', color: 'var(--text-color)', marginTop: '4px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '10px', width: 'fit-content', alignSelf: 'center' }}>{subValue}</span>}
            </div>
        </div>
    );
}

// Block for Astronomy details
function AstroBlock({ icon, label, value, isIndex }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            textAlign: 'center'
        }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>{label}</span>
                <span style={{
                    display: 'block',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isIndex ? (value > 8 ? '#f43f5e' : value > 5 ? '#f59e0b' : '#10b981') : 'var(--text-color)'
                }}>
                    {value}
                </span>
            </div>
        </div>
    );
}

