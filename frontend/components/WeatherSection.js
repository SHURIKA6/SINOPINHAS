import React, { useEffect } from 'react';

export default function WeatherSection() {
    useEffect(() => {
        // Function to reload the widget script
        const loadWidget = () => {
            const id = 'weatherwidget-io-js';
            const existingScript = document.getElementById(id);

            // Remove existing script if it exists to force reload
            if (existingScript) {
                existingScript.remove();
            }

            // Create and append new script
            const script = document.createElement('script');
            script.id = id;
            script.src = 'https://weatherwidget.io/js/widget.min.js';
            script.async = true;
            document.body.appendChild(script);
        };

        // Small delay to ensure DOM is ready for double widget injection
        setTimeout(loadWidget, 100);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '40px 20px',
            color: '#fff',
            position: 'relative',
        }}>
            {/* Background Decorativo */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 30%, rgba(141, 106, 255, 0.15) 0%, rgba(0,0,0,0) 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                maxWidth: '800px',
                background: 'rgba(33, 33, 33, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '30px'
                }}>
                    <span style={{ fontSize: '32px' }}>🌦️</span>
                    <h2 style={{
                        margin: 0,
                        fontSize: '32px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        Previsão do Tempo
                    </h2>
                </div>

                {/* HOJE (Current) */}
                <div style={{
                    width: '100%',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        marginBottom: '10px',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#fcd34d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>☀️</span> Hoje em Sinop
                    </div>
                    <div style={{
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        background: '#1e293b'
                    }}>
                        <a
                            className="weatherwidget-io"
                            href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                            data-label_1="SINOP"
                            data-label_2="AGORA"
                            data-font="Roboto"
                            data-icons="Climacons Animated"
                            data-mode="Current"
                            data-days="3"
                            data-theme="weather_one"
                            data-basecolor="#1e293b"
                            data-accent="#8d6aff"
                            data-textcolor="#ffffff"
                            data-highcolor="#fcd34d"
                            data-lowcolor="#94a3b8"
                        >
                            SINOP HOJE
                        </a>
                    </div>
                </div>

                {/* PROXIMOS DIAS (List) */}
                <div style={{
                    width: '100%',
                }}>
                    <div style={{
                        marginBottom: '10px',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📅</span> Próximos 7 Dias
                    </div>
                    <div style={{
                        width: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        background: '#1e293b'
                    }}>
                        <a
                            className="weatherwidget-io"
                            href="https://forecast7.com/pt/n11d86n55d51/sinop/"
                            data-label_1="SINOP"
                            data-label_2="FUTURO"
                            data-font="Roboto"
                            data-icons="Climacons Animated"
                            data-mode="Forecast"
                            data-days="7"
                            data-theme="weather_one"
                            data-basecolor="#0f172a"
                            data-accent="#8d6aff"
                            data-textcolor="#e2e8f0"
                        >
                            SINOP FUTURO
                        </a>
                    </div>
                </div>

                <div style={{
                    marginTop: '30px',
                    display: 'flex',
                    gap: '20px',
                    fontSize: '13px',
                    color: '#64748b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📍</span> Sinop - MT
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📡</span> Dados via Forecast7
                    </div>
                </div>
            </div>
        </div>
    );
}
