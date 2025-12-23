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
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
                >
                    {item.isCenter ? (
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="center-button-wrapper"
                        >
                            <div className="center-button">
                                {item.icon}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="icon-container">
                                {item.icon}
                                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                            </div>
                            <span className="label">{item.label}</span>
                        </>
                    )}
                </button>
            ))}

            <style jsx>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--header-bg);
                    display: none;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 4px calc(env(safe-area-inset-bottom) / 2);
                    height: calc(65px + env(safe-area-inset-bottom));
                    border-top: 1px solid var(--border-color);
                    z-index: 9000;
                    backdrop-filter: blur(25px);
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
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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
                    width: 58px;
                    height: 58px;
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 5px solid var(--bg-color);
                    transition: all 0.3s ease;
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
                    border-radius: 8px;
                    padding: 0 4px;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 9px;
                    font-weight: 900;
                    border: 2px solid var(--header-bg);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </nav>
    );
}

