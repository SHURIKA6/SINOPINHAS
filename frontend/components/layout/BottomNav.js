import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutGrid, Newspaper, Calendar,
    Plus, MessageCircle, MapPin, CloudSun, Settings, Lock
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin, showSecretTab }) {
    const navItems = [
        { id: 'feed', label: 'Feed', icon: <LayoutGrid size={20} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={20} /> },
        { id: 'eventos', label: 'Agenda', icon: <Calendar size={20} /> },
        { id: 'upload', label: 'Postar', icon: <Plus size={28} />, isCenter: true },
        { id: 'inbox', label: 'Chat', icon: <MessageCircle size={20} />, badge: unreadCount },
        isAdmin ? { id: 'admin', label: 'Painel', icon: <Settings size={20} /> } : { id: 'lugares', label: 'Guia', icon: <MapPin size={20} /> },
        { id: 'weather', label: 'Clima', icon: <CloudSun size={20} /> },
    ];

    if (showSecretTab || isAdmin) {
        navItems.push({ id: 'secret', label: 'Secreto', icon: <Lock size={20} /> });
    }

    // Estilos inline para garantir que NENHUMA regra externa crie caixas brancas
    const btnBaseStyle = {
        background: 'none',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
    };

    return (
        <div className="extreme-nav-wrapper">
            <nav className="ultra-glass-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={btnBaseStyle}
                        className={`ultra-nav-btn ${activeTab === item.id ? 'active' : ''} ${item.isCenter ? 'is-post' : ''}`}
                    >
                        {item.isCenter ? (
                            <div className="premium-plus-button">
                                {item.icon}
                            </div>
                        ) : (
                            <>
                                <div className="ultra-icon-box">
                                    {item.icon}
                                    {item.badge > 0 && <span className="ultra-badge">{item.badge}</span>}
                                </div>
                                <span className="ultra-label">{item.label}</span>
                                {activeTab === item.id && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="active-pill"
                                        transition={{ type: 'spring', duration: 0.5 }}
                                    />
                                )}
                            </>
                        )}
                    </button>
                ))}
            </nav>

            <style jsx>{`
                .extreme-nav-wrapper {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 0 12px 24px;
                    z-index: 999999;
                    display: none;
                    pointer-events: none;
                }

                @media (max-width: 1024px) {
                    .extreme-nav-wrapper { display: block; }
                }

                .ultra-glass-nav {
                    pointer-events: auto;
                    display: flex;
                    justify-content: flex-start; /* Changed from space-around */
                    align-items: center;
                    height: 72px;
                    background: rgba(15, 13, 21, 0.7);
                    backdrop-filter: blur(32px) saturate(180%);
                    -webkit-backdrop-filter: blur(32px) saturate(180%);
                    border-radius: 30px;
                    border: 1.5px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 
                        0 20px 40px rgba(0, 0, 0, 0.6),
                        inset 0 1px 2px rgba(255, 255, 255, 0.1);
                    padding: 0 4px;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                /* Hide Scrollbar */
                .ultra-glass-nav::-webkit-scrollbar { display: none; }
                .ultra-glass-nav { -ms-overflow-style: none; scrollbar-width: none; }

                .ultra-nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255, 255, 255, 0.35);
                    cursor: pointer;
                    flex: 0 0 auto; /* Stop shrinking */
                    min-width: 64px; /* Ensure touch target size */
                    padding: 0 8px;
                    height: 100%;
                    gap: 4px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .ultra-nav-btn.active {
                    color: #fff;
                }

                .ultra-icon-box {
                    position: relative;
                    display: flex;
                    z-index: 2;
                }

                .ultra-label {
                    font-size: 8px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 2;
                }

                .active-pill {
                    position: absolute;
                    width: 44px;
                    height: 44px;
                    background: rgba(168, 85, 247, 0.15);
                    border-radius: 50%;
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    z-index: 1;
                    filter: blur(10px);
                }

                .premium-plus-button {
                    width: 58px;
                    height: 58px;
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 0px; /* Alinhado centralmente */
                    box-shadow: 0 12px 30px rgba(168, 85, 247, 0.5);
                    border: 4px solid #0f0d15;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .ultra-nav-btn:active .premium-plus-button {
                    transform: scale(0.9);
                }

                .ultra-badge {
                    position: absolute;
                    top: -6px;
                    right: -10px;
                    background: #ff4757;
                    color: white;
                    font-size: 8px;
                    font-weight: 900;
                    height: 16px;
                    min-width: 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #0f0d15;
                    padding: 0 3px;
                }
    `}</style>
        </div>
    );
}
