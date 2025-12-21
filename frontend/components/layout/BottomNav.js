import { useState } from 'react';

export default function BottomNav({ activeTab, setActiveTab, unreadCount, isAdmin }) {
    return (
        <nav className="bottom-nav">
            <button
                onClick={() => setActiveTab('feed')}
                className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            >
                <span className="icon">🎨</span>
                <span className="label">Explorar</span>
            </button>
            <button
                onClick={() => setActiveTab('news')}
                className={`nav-item ${activeTab === 'news' ? 'active' : ''}`}
            >
                <span className="icon">📰</span>
                <span className="label">Notícias</span>
            </button>
            <button
                onClick={() => setActiveTab('eventos')}
                className={`nav-item ${activeTab === 'eventos' ? 'active' : ''}`}
            >
                <span className="icon">📅</span>
                <span className="label">Eventos</span>
            </button>
            <button
                onClick={() => setActiveTab('upload')}
                className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            >
                <div className="upload-btn-container">
                    <div className="upload-btn">
                        <span className="icon-plus">+</span>
                    </div>
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
                    justify-content: center;
                    gap: 4px;
                    color: var(--secondary-text);
                    cursor: pointer;
                    flex: 1;
                    transition: all 0.2s ease;
                    outline: none;
                    height: 100%;
                    padding: 0;
                }

                .nav-item.active {
                    color: var(--accent-color);
                }

                .icon {
                    font-size: 20px;
                }

                .label {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: -0.2px;
                }

                .upload-btn-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    width: 100%;
                }

                .upload-btn {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(141, 106, 255, 0.4);
                    transition: all 0.2s ease;
                }

                .icon-plus {
                    font-size: 28px;
                    color: #fff;
                    font-weight: 500;
                    line-height: 1;
                    margin-bottom: 2px;
                }

                .nav-item:active .upload-btn {
                    transform: scale(0.9);
                }

                .badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 5px;
                    min-width: 16px;
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
