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

        // Fetch REAL data from Open-Meteo API (Free, no key)
        const fetchRealData = async () => {
            try {
                // Coordinates for Sinop, MT: -11.8641, -55.5031
                const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-11.8641&longitude=-55.5031&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_gusts_10m&wind_speed_unit=kmh&timezone=America%2FCuiaba');
                const data = await res.json();
                setRealData(data.current);
            } catch (error) {
                console.error("Failed to fetch real weather data", error);
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
            padding: '60px 20px',
            color: '#fff',
            position: 'relative',
            background: 'transparent',
            minHeight: '80vh',
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
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
                    radial-gradient(circle at 20% 30%, rgba(141, 106, 255, 0.4) 0%, transparent 60%),
                    radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.3) 0%, transparent 60%)
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
                maxWidth: '1000px', // Aumentado para preencher mais
                display: 'flex',
                flexDirection: 'column',
                gap: '40px'
            }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{
                        fontSize: '56px',
                        fontWeight: '800',
                        marginBottom: '10px',
                        background: 'linear-gradient(to right, #ffffff, #c4b5fd)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 4px 20px rgba(141, 106, 255, 0.3)'
                    }}>
                        Sinop Weather
                    </h2>
                    <p style={{
                        fontSize: '20px',
                        color: '#94a3b8',
                        fontWeight: '500'
                    }}>
                        Monitoramento climático preciso e em tempo real
                    </p>
                </div>

                {/* Grid de Cards Principal */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '24px',
                    width: '100%'
                }}>

                    {/* Card: HOJE e DETALHES */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '30px', // Mais padding
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: 'fadeInUp 0.6s ease-out',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 25px 60px -12px rgba(141, 106, 255, 0.25)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 20px 50px -12px rgba(0, 0, 0, 0.5)';
                        }}
                    >
                        <div style={{
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '15px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px', background: 'rgba(252, 211, 77, 0.2)', padding: '10px', borderRadius: '12px' }}>☀️</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#fff' }}>Agora</h3>
                                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>Dados ao vivo</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>• API Conectada</span>
                        </div>

                        {/* Widget Visual */}
                        <div style={{ borderRadius: '16px', overflow: 'hidden', minHeight: '180px', marginBottom: '24px' }}>
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
                                data-textcolor="#ffffff"
                                data-highcolor="#fcd34d"
                                data-lowcolor="#94a3b8"
                            >SINOP HOJE</a>
                        </div>

                        {/* REAL DATA BLOCKS */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}>
                            <DetailBlock
                                icon="🌬️"
                                label="Vento"
                                value={realData ? `${realData.wind_speed_10m} km/h` : '--'}
                                subValue={realData ? `Rajadas: ${realData.wind_gusts_10m} km/h` : ''}
                            />
                            <DetailBlock
                                icon="💧"
                                label="Umidade"
                                value={realData ? `${realData.relative_humidity_2m}%` : '--'}
                            />
                            <DetailBlock
                                icon="🌡️"
                                label="Sensação"
                                value={realData ? `${realData.apparent_temperature}°C` : '--'}
                            />
                            <DetailBlock
                                icon="⏲️"
                                label="Pressão"
                                value={realData ? `${realData.surface_pressure} hPa` : '--'}
                            />
                        </div>
                    </div>

                    {/* Card: PREVISÃO SEMANAL */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '30px',
                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: 'fadeInUp 0.8s ease-out'
                    }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 25px 60px -12px rgba(56, 189, 248, 0.25)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 20px 50px -12px rgba(0, 0, 0, 0.5)';
                        }}
                    >
                        <div style={{
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '15px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '24px', background: 'rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '12px' }}>📅</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#fff' }}>Previsão 7 Dias</h3>
                                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>Tendência Semanal</span>
                                </div>
                            </div>
                        </div>

                        {/* Widget de Previsão */}
                        <div style={{ borderRadius: '16px', overflow: 'hidden', height: '100%' }}>
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
                                data-textcolor="#e2e8f0"
                                style={{
                                    height: '350px', // Altura fixa para preencher o card visualmente
                                    display: 'block'
                                }}
                            >SINOP FUTURO</a>
                        </div>
                    </div>

                </div>

            </div>

            <style jsx>{`
                @keyframes pulseAurora {
                    0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
                    100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

// Componente auxiliar para os blocos de detalhes
function DetailBlock({ icon, label, value, subValue }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s',
            cursor: 'default'
        }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{value}</span>
                {subValue && <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{subValue}</span>}
            </div>
        </div>
    );
}
