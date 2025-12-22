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
                    justify-content: space-around;
                    align-items: flex-end;
                    padding: 8px 4px calc(12px + env(safe-area-inset-bottom));
                    border-top: 1px solid var(--border-color);
                    z-index: 9000;
                    backdrop-filter: blur(20px);
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
                    gap: 5px;
                    color: var(--secondary-text);
                    cursor: pointer;
                    flex: 1;
                    transition: all 0.2s ease;
                    outline: none;
                    padding-bottom: 4px;
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
                    transform: translateY(-2px);
                }

                .label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: -0.2px;
                    opacity: 0.8;
                }

                .nav-item.active .label {
                    opacity: 1;
                }

                .center-item {
                    padding-bottom: 12px;
                }

                .center-button-wrapper {
                    position: relative;
                    margin-top: -24px;
                }

                .center-button {
                    width: 54px;
                    height: 54px;
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
                    color: white;
                    border: 4px solid var(--bg-color);
                }

                .nav-badge {
                    position: absolute;
                    top: -4px;
                    right: -8px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    padding: 2px;
                    min-width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 800;
                    border: 2px solid var(--bg-color);
                }
            `}</style>
        </nav>
    );
}
