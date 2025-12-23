import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutGrid, Newspaper, Calendar,
    Plus, MessageCircle, MapPin, CloudSun, Settings
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin }) {
    const navItems = [
        { id: 'feed', label: 'Explorar', icon: <LayoutGrid size={22} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={22} /> },
        { id: 'eventos', label: 'Eventos', icon: <Calendar size={22} /> },
        { id: 'upload', label: 'Postar', icon: <Plus size={28} />, isCenter: true },
        { id: 'inbox', label: 'Chat', icon: <MessageCircle size={22} />, badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Painel', icon: <Settings size={22} /> } : { id: 'lugares', label: 'Lugares', icon: <MapPin size={22} /> },
        { id: 'weather', label: 'Clima', icon: <CloudSun size={22} /> },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    whileTap={{ scale: 0.92 }}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
                >
                    {item.isCenter ? (
                        <div className="center-button-wrapper">
                            <div className="center-button">
                                {item.icon}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="icon-container">
                                {item.icon}
                                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                            </div>
                            <span className="label">{item.label}</span>
                        </>
                    )}
                </motion.button>
            ))}

            <style jsx>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(15, 13, 21, 0.85);
                    display: none;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 4px calc(env(safe-area-inset-bottom, 0px) / 2);
                    height: calc(70px + env(safe-area-inset-bottom, 0px));
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 9000;
                    backdrop-filter: blur(25px) saturate(160%);
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
                }

                @media (max-width: 1024px) {
                    .bottom-nav {
                        display: flex;
                    }
                }

                .nav-item {
                    background: none;
                    border: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    color: var(--secondary-text);
                    cursor: pointer;
                    flex: 1;
                    transition: all 0.2s ease;
                    outline: none;
                    height: 65px;
                    min-width: 0;
                }

                .nav-item.active {
                    color: var(--accent-color);
                }

                .icon-container {
                    position: relative;
                    display: flex;
                    transition: transform 0.2s ease;
                }

                .nav-item.active .icon-container {
                    transform: translateY(-2px) scale(1.1);
                }

                .label {
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: -0.1px;
                    opacity: 0.7;
                    text-transform: uppercase;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }

                .nav-item.active .label {
                    opacity: 1;
                }

                .center-item {
                    overflow: visible;
                }

                .center-button-wrapper {
                    position: relative;
                    margin-top: -35px;
                    z-index: 9001;
                }

                .center-button {
                    width: 62px;
                    height: 62px;
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    border-radius: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);
                    color: white;
                    border: 4px solid #0f0d15;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .nav-item.active .center-button {
                    transform: scale(1.05);
                    box-shadow: 0 12px 30px rgba(168, 85, 247, 0.6);
                }

                .nav-badge {
                    position: absolute;
                    top: -6px;
                    right: -10px;
                    background: #ff4757;
                    color: white;
                    border-radius: 10px;
                    padding: 0 4px;
                    min-width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 900;
                    border: 2px solid #0f0d15;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </nav>
    );
}
