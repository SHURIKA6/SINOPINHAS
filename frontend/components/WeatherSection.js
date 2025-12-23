import React, { useEffect, useState } from 'react';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wind,
    Sunrise,
    Sunset,
    Droplets,
    Thermometer,
    Clock,
    Calendar,
    CloudRain,
    Sun,
    Cloud,
    CloudLightning
} from 'lucide-react';

export default function WeatherSection() {
    const [realData, setRealData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

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

                const desc = data.description?.toLowerCase() || '';
                let theme = 'clear';
                if (desc.includes('rain') || desc.includes('drizzle')) theme = 'rain';
                if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('nublado')) theme = 'cloudy';
                if (desc.includes('storm') || desc.includes('thunder')) theme = 'storm';

                document.documentElement.setAttribute('data-weather', theme);
            } catch (error) { }
        };

        fetchRealData();

        const script = document.createElement('script');
        script.src = 'https://weatherwidget.io/js/widget.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            window.removeEventListener('resize', checkMobile);
            clearInterval(timer);
            document.documentElement.removeAttribute('data-weather');
        };
    }, []);

    const WeatherStat = ({ icon, label, value, color }) => (
        <div className="stat-card">
            <div className="stat-icon" style={{ color: color || 'var(--accent-color)' }}>{icon}</div>
            <div className="stat-content">
                <span className="stat-label">{label}</span>
                <span className="stat-value">{value || '--'}</span>
            </div>
        </div>
    );

    return (
        <div className="weather-container">
            {/* Background contextual dinâmico */}
            <div className="weather-bg-overlay" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="weather-header"
            >
                <h2 className="weather-title">SINOPINHAS WEATHER</h2>
                <div className="weather-date">
                    <Calendar size={14} style={{ marginRight: 8 }} />
                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </motion.div>

            <div className="weather-grid">
                {/* Card do Relógio Digital */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="clock-card"
                >
                    <div className="live-indicator">
                        <span className="pulse-dot"></span>
                        LIVE SINOP
                    </div>

                    <div className="clock-display">
                        <span className="time-main">
                            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <span className="time-seconds">
                            :{currentTime.toLocaleTimeString('pt-BR', { second: '2-digit' })}
                        </span>
                    </div>

                    <div className="clock-footer">
                        <Clock size={12} style={{ marginRight: 6 }} />
                        Horário de Brasília (GMT-3)
                    </div>
                </motion.div>

                {/* Grid de Estatísticas em Tempo Real */}
                <div className="stats-container">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="stats-inner-grid"
                    >
                        <WeatherStat
                            icon={<Thermometer size={18} />}
                            label="TEMPERATURA"
                            value={realData?.temp ? `${realData.temp}°C` : '--'}
                            color="#ff6b6b"
                        />
                        <WeatherStat
                            icon={<Droplets size={18} />}
                            label="UMIDADE"
                            value={realData?.humidity ? `${realData.humidity}%` : '--'}
                            color="#4dabf7"
                        />
                        <WeatherStat
                            icon={<Wind size={18} />}
                            label="VENTO"
                            value={realData?.wind_speedy}
                            color="#51cf66"
                        />
                        <WeatherStat
                            icon={<Sunrise size={18} />}
                            label="NASCER DO SOL"
                            value={realData?.sunrise}
                            color="#fcc419"
                        />
                        <WeatherStat
                            icon={<Sunset size={18} />}
                            label="PÔR DO SOL"
                            value={realData?.sunset}
                            color="#ff922b"
                        />
                        <WeatherStat
                            icon={<Thermometer size={18} />}
                            label="SENSAÇÃO TMP"
                            value={realData?.feels_like ? `${realData.feels_like}°C` : '--'}
                            color="#ff8787"
                        />
                    </motion.div>

                    {/* Widget Externo Integrado */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="widget-wrapper"
                    >
                        <a className="weatherwidget-io" href="https://forecast7.com/pt/n11d86n55d51/sinop/" data-label_1="SINOP" data-label_2="MATO GROSSO" data-theme="weather_one" data-basecolor="rgba(0,0,0,0)" data-textcolor="var(--text-color)">SINOP WEATHER</a>
                    </motion.div>
                </div>
            </div>

            <style jsx>{`
                .weather-container {
                    position: relative;
                    width: 100%;
                    padding: 20px 0 80px 0;
                }
                .weather-bg-overlay {
                    position: fixed;
                    inset: 0;
                    background: var(--weather-overlay);
                    pointer-events: none;
                    zIndex: -1;
                    transition: all 2s ease;
                }
                .weather-header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                .weather-title {
                    font-size: 38px;
                    font-weight: 900;
                    margin: 0;
                    background: linear-gradient(135deg, #a855f7 0%, #ff6b9d 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -1.5px;
                    text-transform: uppercase;
                }
                .weather-date {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--secondary-text);
                    font-weight: 700;
                    font-size: 14px;
                    margin-top: 8px;
                    text-transform: capitalize;
                }
                .weather-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 24px;
                    padding: 0 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .clock-card {
                    background: var(--card-bg);
                    backdrop-filter: blur(20px);
                    border-radius: 32px;
                    padding: 40px 32px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .live-indicator {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    background: rgba(255, 0, 0, 0.1);
                    color: #ff4d4d;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 10px;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    letter-spacing: 1px;
                }
                .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: #ff4d4d;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
                    70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 6px rgba(255, 77, 77, 0); }
                    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
                }
                .clock-display {
                    display: flex;
                    align-items: baseline;
                    font-family: 'JetBrains Mono', monospace;
                }
                .time-main {
                    font-size: 82px;
                    font-weight: 900;
                    background: linear-gradient(180deg, #fff 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    line-height: 1;
                }
                .time-seconds {
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--accent-color);
                    opacity: 0.8;
                    margin-left: 4px;
                }
                .clock-footer {
                    margin-top: 24px;
                    font-size: 12px;
                    color: var(--secondary-text);
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                }
                .stats-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .stats-inner-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }
                .stat-card {
                    background: var(--card-bg);
                    padding: 20px;
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-color);
                    background: rgba(168, 85, 247, 0.05);
                }
                .stat-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }
                .stat-content {
                    display: flex;
                    flex-direction: column;
                }
                .stat-label {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--secondary-text);
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: 900;
                    color: var(--text-color);
                }
                .widget-wrapper {
                    background: var(--card-bg);
                    border-radius: 24px;
                    padding: 16px;
                    border: 1px solid var(--border-color);
                }
                @media (max-width: 1024px) {
                    .weather-grid {
                        grid-template-columns: 1fr;
                    }
                    .stats-inner-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 768px) {
                    .weather-title { font-size: 28px; }
                    .time-main { font-size: 64px; }
                    .stats-inner-grid { grid-template-columns: 1fr; }
                    .clock-card { padding: 60px 20px 40px; }
                }
            `}</style>
        </div>
    );
}

