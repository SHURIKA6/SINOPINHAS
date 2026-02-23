import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Heart, MessageSquare, Video } from 'lucide-react';

/**
 * NotificationsDropdown — Dropdown de notificações estilo Frutiger Aero
 * No mobile, abre como painel fixo centralizado. No desktop, dropdown absoluto.
 * Props: notifications, unreadCount, onMarkAllRead, onClose, isOpen
 */
export default function NotificationsDropdown({ notifications = [], unreadCount = 0, onMarkAllRead, onClose, isOpen }) {
    const ref = useRef(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose?.();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={14} color="#FF3B30" fill="#FF3B30" />;
            case 'comment': return <MessageSquare size={14} color="#4DA6FF" />;
            case 'video': return <Video size={14} color="#34C759" />;
            default: return <Bell size={14} color="#0047AB" />;
        }
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'agora';
        if (diffMin < 60) return `${diffMin}m`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h`;
        const diffDays = Math.floor(diffHr / 24);
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop escuro no mobile */}
            <div className="notif-backdrop" onClick={onClose} />

            <AnimatePresence>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="notif-dropdown"
                >
                    {/* Brilho vítreo Aero */}
                    <div className="notif-gloss" />

                    {/* Header */}
                    <div className="notif-header">
                        <h3 className="notif-title">
                            <Bell size={16} />
                            Notificações
                            {unreadCount > 0 && (
                                <span className="notif-badge">{unreadCount}</span>
                            )}
                        </h3>
                        <div className="notif-header-actions">
                            {unreadCount > 0 && (
                                <button onClick={onMarkAllRead} className="notif-mark-btn">
                                    <CheckCheck size={13} />
                                    Marcar lidas
                                </button>
                            )}
                            <button onClick={onClose} className="notif-close-btn">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Lista */}
                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">
                                    <Bell size={36} />
                                </div>
                                <p>Nenhuma notificação</p>
                                <span>Você será notificado sobre novas atividades</span>
                            </div>
                        ) : (
                            notifications.map((notif, idx) => (
                                <div
                                    key={notif.id || idx}
                                    className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                                >
                                    <div className="notif-icon-circle">
                                        {getNotificationIcon(notif.type)}
                                    </div>
                                    <div className="notif-content">
                                        <p className="notif-message">{notif.message}</p>
                                        <span className="notif-time">{timeAgo(notif.created_at)}</span>
                                    </div>
                                    {!notif.is_read && <div className="notif-unread-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <style jsx>{`
                .notif-backdrop {
                    display: none;
                }

                .notif-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 10px;
                    width: 360px;
                    max-height: 460px;
                    background: linear-gradient(180deg,
                        rgba(255, 255, 255, 0.92) 0%,
                        rgba(255, 255, 255, 0.8) 40%,
                        rgba(245, 250, 255, 0.85) 100%);
                    backdrop-filter: blur(24px) saturate(140%);
                    -webkit-backdrop-filter: blur(24px) saturate(140%);
                    border-radius: 20px;
                    box-shadow:
                        0 12px 40px rgba(0, 71, 171, 0.18),
                        0 4px 12px rgba(0, 0, 0, 0.08),
                        inset 0 1px 0 rgba(255, 255, 255, 1);
                    border: 1px solid rgba(255, 255, 255, 0.7);
                    border-top: 1px solid rgba(255, 255, 255, 0.95);
                    overflow: hidden;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                }

                .notif-gloss {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 45%;
                    background: linear-gradient(to bottom,
                        rgba(255, 255, 255, 0.5) 0%,
                        rgba(255, 255, 255, 0.05) 100%);
                    pointer-events: none;
                    border-radius: 18px 18px 60% 60% / 16px 16px 20px 20px;
                    z-index: 0;
                }

                .notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 18px;
                    border-bottom: 1px solid rgba(0, 71, 171, 0.08);
                    background: linear-gradient(180deg,
                        rgba(255, 255, 255, 0.6) 0%,
                        rgba(240, 248, 255, 0.4) 100%);
                    position: relative;
                    z-index: 1;
                }

                .notif-title {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 800;
                    color: #003366;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
                }

                .notif-badge {
                    background: linear-gradient(135deg, #FF6B6B, #FF3B30);
                    color: white;
                    border-radius: 10px;
                    padding: 2px 8px;
                    font-size: 11px;
                    font-weight: 700;
                    box-shadow: 0 2px 6px rgba(255, 59, 48, 0.3);
                }

                .notif-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .notif-mark-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 71, 171, 0.15);
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(230, 240, 255, 0.7) 100%);
                    color: #0047AB;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .notif-mark-btn:hover {
                    background: #FFFFFF;
                    border-color: #00C6FF;
                    box-shadow: 0 2px 8px rgba(0, 198, 255, 0.2);
                }

                .notif-close-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(0, 0, 0, 0.04);
                    color: #667;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .notif-close-btn:hover {
                    background: rgba(255, 59, 48, 0.1);
                    color: #FF3B30;
                }

                .notif-list {
                    overflow-y: auto;
                    max-height: 380px;
                    position: relative;
                    z-index: 1;
                }

                .notif-empty {
                    padding: 48px 24px;
                    text-align: center;
                }

                .notif-empty-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 12px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, rgba(0, 71, 171, 0.06) 0%, rgba(77, 166, 255, 0.08) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #a0b4cc;
                }

                .notif-empty p {
                    margin: 0 0 4px;
                    font-size: 15px;
                    font-weight: 700;
                    color: #003366;
                }

                .notif-empty span {
                    font-size: 12px;
                    color: #8899aa;
                }

                .notif-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 14px 18px;
                    border-bottom: 1px solid rgba(0, 71, 171, 0.04);
                    transition: background 0.2s;
                    cursor: pointer;
                }

                .notif-item:hover {
                    background: rgba(77, 166, 255, 0.06);
                }

                .notif-item.unread {
                    background: rgba(77, 166, 255, 0.05);
                }

                .notif-item.unread:hover {
                    background: rgba(77, 166, 255, 0.1);
                }

                .notif-icon-circle {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(230, 240, 255, 0.6) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
                }

                .notif-content {
                    flex: 1;
                    min-width: 0;
                }

                .notif-message {
                    margin: 0;
                    font-size: 13px;
                    color: #1a2a3a;
                    line-height: 1.45;
                    word-break: break-word;
                    font-weight: 500;
                }

                .notif-time {
                    font-size: 11px;
                    color: #8899aa;
                    margin-top: 3px;
                    display: block;
                    font-weight: 600;
                }

                .notif-unread-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #00C6FF, #0047AB);
                    flex-shrink: 0;
                    margin-top: 6px;
                    box-shadow: 0 0 6px rgba(0, 198, 255, 0.4);
                }

                /* ===== MOBILE ===== */
                @media (max-width: 768px) {
                    .notif-backdrop {
                        display: block;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.4);
                        backdrop-filter: blur(4px);
                        z-index: 1999;
                    }

                    .notif-dropdown {
                        position: fixed;
                        top: 12px;
                        left: 12px;
                        right: 12px;
                        bottom: auto;
                        width: auto;
                        max-height: 75vh;
                        margin-top: 0;
                        border-radius: 24px;
                        z-index: 2000;
                        box-shadow:
                            0 20px 60px rgba(0, 0, 0, 0.25),
                            0 4px 16px rgba(0, 71, 171, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 1);
                    }

                    .notif-header {
                        padding: 18px 20px;
                    }

                    .notif-title {
                        font-size: 17px;
                    }

                    .notif-item {
                        padding: 16px 20px;
                    }

                    .notif-list {
                        max-height: calc(75vh - 70px);
                    }
                }
            `}</style>
        </>
    );
}
