import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutGrid, Newspaper, Calendar,
    Plus, MessageCircle, MapPin, CloudSun, Settings
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin }) {
    const navItems = [
        { id: 'feed', label: 'Feed', icon: <LayoutGrid size={20} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={20} /> },
        { id: 'eventos', label: 'Eventos', icon: <Calendar size={20} /> },
        { id: 'upload', label: 'Postar', icon: <Plus size={26} />, isCenter: true },
        { id: 'inbox', label: 'Chat', icon: <MessageCircle size={20} />, badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Painel', icon: <Settings size={20} /> } : { id: 'lugares', label: 'Lugares', icon: <MapPin size={20} /> },
        { id: 'weather', label: 'Clima', icon: <CloudSun size={20} /> },
    ];

    return (
        <div className="nav-wrapper">
            <nav className="bottom-nav">
                {navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        whileTap={{ scale: 0.9 }}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
                    >
                        {item.isCenter ? (
                            <div className="plus-button-elevated">
                                {item.icon}
                            </div>
                        ) : (
                            <>
                                <div className="icon-box">
                                    {item.icon}
                                    {item.badge > 0 && <span className="badge-dot">{item.badge}</span>}
                                </div>
                                <span className="nav-label">{item.label}</span>
                                {activeTab === item.id && <motion.div layoutId="active-dot" className="active-indicator" />}
                            </>
                        )}
                    </motion.button>
                ))}
            </nav>

            <style jsx>{`
                .nav-wrapper {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 0 12px 20px;
                    z-index: 9999;
                    display: none;
                    pointer-events: none;
                }

                @media (max-width: 1024px) {
                    .nav-wrapper {
                        display: block;
                    }
                }

                .bottom-nav {
                    pointer-events: auto;
                    background: rgba(15, 13, 21, 0.85);
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    height: 72px;
                    border-radius: 28px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
                    padding: 0 4px;
                }

                .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: none !important;
                    border: none !important;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    position: relative;
                    flex: 1;
                    height: 100%;
                    gap: 3px;
                    padding: 0;
                    outline: none !important;
                    -webkit-tap-highlight-color: transparent;
                }

                .nav-item.active {
                    color: var(--accent-color);
                }

                .icon-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease;
                }

                .nav-item.active .icon-box {
                    transform: translateY(-2px);
                }

                .nav-label {
                    font-size: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.2px;
                    white-space: nowrap;
                }

                .active-indicator {
                    position: absolute;
                    bottom: 10px;
                    width: 4px;
                    height: 4px;
                    background: var(--accent-color);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--accent-color);
                }

                .plus-button-elevated {
                    width: 58px;
                    height: 58px;
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 24px;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);
                    border: 4px solid #0f0d15;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .nav-item.active .plus-button-elevated {
                    transform: scale(1.05) translateY(-5px);
                    box-shadow: 0 12px 30px rgba(168, 85, 247, 0.6);
                }

                .badge-dot {
                    position: absolute;
                    top: -5px;
                    right: -8px;
                    background: #ff4757;
                    color: white;
                    font-size: 9px;
                    font-weight: 900;
                    height: 16px;
                    min-width: 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #0f0d15;
                    padding: 0 4px;
                }
            `}</style>
        </div>
    );
}
