import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Heart, MessageSquare, Video } from 'lucide-react';

/**
 * NotificationsDropdown — Dropdown de notificações a partir do ícone de sino
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

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={14} color="#FF3B30" fill="#FF3B30" />;
            case 'comment': return <MessageSquare size={14} color="#4DA6FF" />;
            case 'video': return <Video size={14} color="#34C759" />;
            default: return <Bell size={14} color="#666" />;
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
        <AnimatePresence>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '340px',
                    maxHeight: '420px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    overflow: 'hidden',
                    zIndex: 1000,
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,248,255,1) 100%)',
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1a1a2e',
                    }}>
                        Notificações {unreadCount > 0 && (
                            <span style={{
                                background: '#FF3B30',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 8px',
                                fontSize: '11px',
                                marginLeft: '6px',
                                fontWeight: 600,
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'rgba(0, 71, 171, 0.08)',
                                color: '#0047AB',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            <CheckCheck size={12} />
                            Marcar lidas
                        </button>
                    )}
                </div>

                {/* Lista */}
                <div style={{
                    overflowY: 'auto',
                    maxHeight: '360px',
                }}>
                    {notifications.length === 0 ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '14px',
                        }}>
                            <Bell size={32} color="#ccc" style={{ marginBottom: '8px' }} />
                            <p style={{ margin: 0 }}>Nenhuma notificação</p>
                        </div>
                    ) : (
                        notifications.map((notif, idx) => (
                            <div
                                key={notif.id || idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    background: notif.is_read ? 'transparent' : 'rgba(77, 166, 255, 0.06)',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(77, 166, 255, 0.06)'}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(77, 166, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '13px',
                                        color: '#333',
                                        lineHeight: 1.4,
                                        wordBreak: 'break-word',
                                    }}>
                                        {notif.message}
                                    </p>
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        marginTop: '2px',
                                        display: 'block',
                                    }}>
                                        {timeAgo(notif.created_at)}
                                    </span>
                                </div>
                                {!notif.is_read && (
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#4DA6FF',
                                        flexShrink: 0,
                                        marginTop: '4px',
                                    }} />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
