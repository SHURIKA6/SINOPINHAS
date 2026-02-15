import React from 'react';
import { motion } from 'framer-motion';
import {
    LayoutGrid, Compass,
    Plus, MessageCircle, User, Settings
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin, showSecretTab }) {
    const navItems = [
        { id: 'feed', label: 'Feed', icon: <LayoutGrid size={20} /> },
        { id: 'upload', label: 'Postar', icon: <Plus size={28} />, isCenter: true },
        { id: 'inbox', label: 'Chat', icon: <MessageCircle size={20} />, badge: unreadCount },
        isAdmin
            ? { id: 'admin', label: 'Painel', icon: <Settings size={20} /> }
            : { id: 'profile', label: 'Perfil', icon: <User size={20} /> },
    ];

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
                    padding: 0 8px 16px;
                    padding-bottom: calc(16px + env(safe-area-inset-bottom));
                    z-index: 999999;
                    display: none;
                    pointer-events: none;
                }

                @media (max-width: 1024px) {
                    .extreme-nav-wrapper { display: block; }
                }

                .ultra-glass-nav {
                    pointer-events: auto;
                    display: grid;
                    grid-template-columns: 1fr 1.3fr 1fr 1fr;
                    gap: 0;
                    align-items: center;
                    height: 72px;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.3) 100%);
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.9);
                    border-top: 2px solid rgba(255, 255, 255, 1);
                    box-shadow: 
                        0 20px 40px rgba(0, 71, 171, 0.2),
                        0 8px 16px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 1),
                        inset 0 -2px 10px rgba(0, 100, 200, 0.05);
                    padding: 0 2px;
                }

                .ultra-nav-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: rgba(0, 51, 102, 0.5);
                    cursor: pointer;
                    width: 100%;
                    height: 100%;
                    gap: 4px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .ultra-nav-btn:hover {
                    color: #0047AB;
                }

                .ultra-nav-btn.active {
                    color: #003366;
                }

                .ultra-icon-box {
                    position: relative;
                    display: flex;
                    z-index: 2;
                }

                .ultra-label {
                    font-size: 9px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 2;
                }

                .active-pill {
                    position: absolute;
                    width: 44px;
                    height: 44px;
                    background: rgba(0, 150, 255, 0.15);
                    border-radius: 50%;
                    border: 1px solid rgba(0, 150, 255, 0.4);
                    z-index: 1;
                    filter: blur(8px);
                }

                .premium-plus-button {
                    width: 58px;
                    height: 58px;
                    background: linear-gradient(135deg, #0058EE 0%, #00C6FF 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 0px;
                    box-shadow: 
                        0 12px 30px rgba(0, 88, 238, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.5);
                    border: 3px solid rgba(255, 255, 255, 0.8);
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
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    padding: 0 3px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
    `}</style>
        </div>
    );
}
