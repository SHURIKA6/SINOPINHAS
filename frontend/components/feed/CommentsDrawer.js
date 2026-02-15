import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';

export default function CommentsDrawer({
    isOpen,
    onClose,
    video,
    comments,
    user,
    newComment,
    setNewComment,
    onSend,
    onDelete,
    canDelete
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Fundo Escuro (Backdrop) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 9998,
                            backdropFilter: 'blur(6px)'
                        }}
                    />

                    {/* Gaveta de Comentários (Drawer) */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Comentários"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'var(--bg-color)',
                            borderTopLeftRadius: '32px',
                            borderTopRightRadius: '32px',
                            zIndex: 9999,
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
                            paddingBottom: 'env(safe-area-inset-bottom, 20px)'
                        }}
                    >
                        <div className="drawer-header" style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer'
                        }} onClick={onClose}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: 'var(--accent-color)', padding: 8, borderRadius: 12, display: 'flex' }}>
                                    <MessageCircle size={20} color="#fff" />
                                </div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                                    Comentários {video && <span style={{ opacity: 0.5, fontWeight: 400 }}>• {video.title}</span>}
                                </h2>
                            </div>
                            <div className="drawer-handle" style={{
                                width: '40px',
                                height: '4px',
                                background: 'var(--border-color)',
                                borderRadius: '2px',
                                position: 'absolute',
                                top: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)'
                            }} />
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
                            {comments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                                    <MessageCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                                    <p style={{ fontSize: 16, fontWeight: 500 }}>Ninguém comentou ainda.</p>
                                    <p style={{ fontSize: 14 }}>Seja o primeiro a compartilhar sua opinião!</p>
                                </div>
                            ) : (
                                comments.map((c, i) => (
                                    <motion.div
                                        key={c.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ display: 'flex', gap: 14, marginBottom: 24 }}
                                    >
                                        <img
                                            src={c.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                                            onClick={() => window.openPublicProfile(c.user_id)}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                background: 'var(--input-bg)',
                                                border: '2px solid var(--border-color)',
                                                cursor: 'pointer'
                                            }}
                                            alt=""
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <strong
                                                    onClick={() => window.openPublicProfile(c.user_id)}
                                                    style={{ fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    {c.username}
                                                </strong>
                                                <span style={{ fontSize: 11, opacity: 0.5 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{
                                                background: 'var(--input-bg)',
                                                padding: '12px 16px',
                                                borderRadius: '0 16px 16px 16px',
                                                border: '1px solid var(--border-color)',
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                color: 'var(--text-color)'
                                            }}>
                                                {c.comment}
                                            </div>
                                            {canDelete(c.user_id?.toString()) && (
                                                <button
                                                    onClick={() => onDelete(c.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        fontSize: 12,
                                                        padding: '8px 0',
                                                        cursor: 'pointer',
                                                        fontWeight: 700,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Remover
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {user && (
                            <div style={{
                                padding: '16px 20px',
                                background: 'var(--bg-color)',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center'
                            }}>
                                <img src={user.avatar || 'https://www.gravatar.com/avatar?d=mp'} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                                <form onSubmit={onSend} style={{ flex: 1, display: 'flex', gap: 10 }}>
                                    <input
                                        placeholder="Escreva um comentário..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: 'var(--input-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '24px',
                                            color: 'var(--text-color)',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        style={{
                                            width: 44,
                                            height: 44,
                                            background: 'var(--accent-color)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
                                        }}
                                    >
                                        <Send size={20} />
                                    </motion.button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
