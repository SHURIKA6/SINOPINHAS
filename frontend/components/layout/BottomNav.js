import { useState } from 'react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin }) {
    return (
        <nav className="bottom-nav">
            <button
                onClick={() => setActiveTab('videos')}
                className={`nav-item ${activeTab === 'videos' ? 'active' : ''}`}
            >
                <span className="icon">🎬</span>
                <span className="label">Vídeos</span>
            </button>
            <button
                onClick={() => setActiveTab('photos')}
                className={`nav-item ${activeTab === 'photos' ? 'active' : ''}`}
            >
                <span className="icon">📷</span>
                <span className="label">Fotos</span>
            </button>
            <button
                onClick={() => setActiveTab('upload')}
                className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            >
                <div className="upload-btn">
                    <span className="icon" style={{ fontSize: 24, color: '#fff' }}>+</span>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('inbox')}
                className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
            >
                <div style={{ position: 'relative' }}>
                    <span className="icon">💬</span>
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                </div>
                <span className="label">Mensagens</span>
            </button>
            <button
                onClick={() => setActiveTab('news')}
                className={`nav-item ${activeTab === 'news' ? 'active' : ''}`}
            >
                <span className="icon">📰</span>
                <span className="label">Notícias</span>
            </button>
            <button
                onClick={() => setActiveTab('lugares')}
                className={`nav-item ${activeTab === 'lugares' ? 'active' : ''}`}
            >
                <span className="icon">📍</span>
                <span className="label">Lugares</span>
            </button>
            <button
                onClick={() => setActiveTab('weather')}
                className={`nav-item ${activeTab === 'weather' ? 'active' : ''}`}
            >
                <span className="icon">⛅</span>
                <span className="label">Clima</span>
            </button>

            <style jsx>{`
                .bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--header-bg);
                    display: none;
                    justify-content: space-around;
                    align-items: center;
                    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
                    border-top: 1px solid var(--border-color);
                    z-index: 9000;
                    backdrop-filter: blur(10px);
                }

                @media (max-width: 768px) {
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
                    gap: 4px;
                    color: var(--secondary-text);
                    cursor: pointer;
                    flex: 1;
                    transition: all 0.2s ease;
                    outline: none;
                }

                .nav-item.active {
                    color: var(--accent-color);
                }

                .icon {
                    font-size: 18px;
                }

                .label {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: -0.2px;
                }

                .upload-btn {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(141, 106, 255, 0.4);
                    margin-top: -10px;
                }

                .badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    border: 2px solid var(--header-bg);
                }
            `}</style>
        </nav>
    );
}
