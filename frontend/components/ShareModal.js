import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ShareModal({ video, user, onClose, showToast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null); // userID being sent to
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await api.get('/api/users/all');
                setUsers(res.data.filter(u => u.id !== user?.id)); // Remove self
            } catch (err) {
                console.error("Failed to load users for sharing", err);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, [user]);

    const handleShare = async (targetUserId) => {
        if (!user) {
            showToast("Faça login para compartilhar no Inbox", "error");
            return;
        }

        setSending(targetUserId);
        try {
            const videoLink = `https://sinopinhas.vercel.app/?v=${video.id}`;
            const msg = `Veja este conteúdo: ${video.title}\n\n[VIDEO_LINK:${video.id}]\n${videoLink}`;

            await api.post('/api/send-message', {
                from_id: user.id,
                to_id: targetUserId,
                msg: msg
            });

            showToast("Enviado com sucesso!", "success");
            setSending(null);
            // Don't close immediately so they can share with more people if they want?
            // Actually, usually it closes. Let's close it.
            onClose();
        } catch (err) {
            showToast("Erro ao enviar.", "error");
            setSending(null);
        }
    };

    const handleCopyLink = () => {
        const videoLink = `https://sinopinhas.vercel.app/?v=${video.id}`;
        navigator.clipboard.writeText(videoLink);
        showToast("Link copiado!", "success");
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: video.description,
                    url: `https://sinopinhas.vercel.app/?v=${video.id}`,
                });
            } catch (err) { }
        } else {
            handleCopyLink();
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 100000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-color)',
                borderTopLeftRadius: 32, borderTopRightRadius: 32,
                padding: '24px 20px 40px',
                width: '100%', maxWidth: 500,
                maxHeight: '85vh',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ width: 40, height: 4, background: 'var(--border-color)', borderRadius: 2, margin: '0 auto 20px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Enviar para...</h3>
                    <button onClick={onClose} style={{ background: 'var(--input-bg)', border: 'none', color: 'var(--text-color)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <button onClick={handleNativeShare} style={{
                        flex: 1, padding: '16px', borderRadius: 16,
                        background: 'var(--accent-color)', border: 'none', color: '#fff',
                        cursor: 'pointer', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}>
                        <span style={{ fontSize: 24 }}>📤</span>
                        Outros Apps
                    </button>
                    <button onClick={handleCopyLink} style={{
                        flex: 1, padding: '16px', borderRadius: 16,
                        background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)',
                        cursor: 'pointer', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}>
                        <span style={{ fontSize: 24 }}>🔗</span>
                        Copiar Link
                    </button>
                </div>

                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar amigos no SINOPINHAS..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12,
                            background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                            color: 'var(--text-color)', outline: 'none', fontSize: 16
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Carregando contatos...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {filteredUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>Nenhum usuário encontrado</div>
                            ) : (
                                filteredUsers.map(u => (
                                    <div key={u.id}
                                        onClick={() => !sending && handleShare(u.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px', background: 'var(--input-bg)', borderRadius: 16,
                                            border: '1px solid var(--border-color)', cursor: 'pointer',
                                            transition: 'transform 0.2s active'
                                        }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%)',
                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 800, fontSize: 18, overflow: 'hidden'
                                        }}>
                                            {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700 }}>{u.username}</div>
                                            <div style={{ fontSize: 12, opacity: 0.5 }}>Enviar via Inbox</div>
                                        </div>
                                        <button
                                            style={{
                                                background: sending === u.id ? 'transparent' : 'var(--accent-color)',
                                                color: '#fff', border: 'none', borderRadius: 12,
                                                padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700
                                            }}
                                        >
                                            {sending === u.id ? '⌛' : 'Enviar'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
