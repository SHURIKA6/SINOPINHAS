import { motion } from 'framer-motion';
import {
    Home,
    Newspaper,
    Plus,
    MessageCircle,
    Menu as MenuIcon
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, onMenuClick }) {
    const navItems = [
        { id: 'feed', label: 'Início', icon: <Home size={22} /> },
        { id: 'news', label: 'Notícias', icon: <Newspaper size={22} /> },
        { id: 'upload', label: 'Postar', icon: <Plus size={28} />, isCenter: true },
        { id: 'inbox', label: 'Chat', icon: <MessageCircle size={22} />, badge: unreadCount },
        { id: 'more', label: 'Mais', icon: <MenuIcon size={22} />, isMenu: true },
    ];

    const handleTabClick = (item) => {
        if (item.isMenu) {
            if (onMenuClick) onMenuClick();
            return;
        }
        setActiveTab(item.id);
    };

    return (
        <nav className="bottom-nav">
            <div className="nav-items-wrapper">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item)}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
                    >
                        {item.isCenter ? (
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="center-button-wrapper"
                            >
                                <div className="center-glow" />
                                <div className="center-button">
                                    {item.icon}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                className="nav-content"
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="icon-container">
                                    {item.icon}
                                    {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                                    {activeTab === item.id && (
                                        <motion.div
                                            layoutId="nav-active-bg"
                                            className="nav-active-bg"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </div>
                                <span className="label">{item.label}</span>
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>

            <style jsx>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(15, 13, 21, 0.8);
                    display: none;
                    padding: 0 8px calc(env(safe-area-inset-bottom) + 8px) 8px;
                    height: calc(75px + env(safe-area-inset-bottom));
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 9000;
                    backdrop-filter: blur(25px);
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4);
                }

                @media (max-width: 1024px) {
                    .bottom-nav {
                        display: flex;
                        justify-content: center;
                    }
                }

                .nav-items-wrapper {
                    display: flex;
                    width: 100%;
                    max-width: 500px;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                }

                .nav-item {
                    background: none;
                    border: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--secondary-text);
                    cursor: pointer;
                    flex: 1;
                    transition: all 0.3s ease;
                    outline: none;
                    height: 65px;
                    min-width: 0;
                    z-index: 2;
                }

                .nav-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    position: relative;
                }

                .nav-item.active {
                    color: var(--accent-color);
                }

                .icon-container {
                    position: relative;
                    display: flex;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    padding: 8px;
                    border-radius: 12px;
                }

                .nav-active-bg {
                    position: absolute;
                    inset: 0;
                    background: rgba(168, 85, 247, 0.1);
                    border-radius: 12px;
                    z-index: -1;
                }

                .nav-item.active .icon-container {
                    transform: translateY(-2px);
                    color: var(--accent-color);
                }

                .label {
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    opacity: 0.5;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }

                .nav-item.active .label {
                    opacity: 1;
                    transform: scale(1.05);
                }

                .center-item {
                    overflow: visible;
                    flex: 1.2;
                }

                .center-button-wrapper {
                    position: relative;
                    margin-top: -30px;
                    z-index: 9001;
                }

                .center-glow {
                    position: absolute;
                    inset: -15px;
                    background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
                    border-radius: 50%;
                    animation: pulse-glow 2s infinite;
                    pointer-events: none;
                }

                .center-button {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5);
                    color: white;
                    border: 4px solid #0f0d15;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes pulse-glow {
                    0% { transform: scale(0.85); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.2; }
                    100% { transform: scale(0.85); opacity: 0.5; }
                }

                .nav-badge {
                    position: absolute;
                    top: 2px;
                    right: 2px;
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
                    border: 2px solid #1a152d;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
            `}</style>
        </nav>
    );
}

