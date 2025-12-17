import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ShareModal({ video, user, onClose, showToast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null); // userID being sent to
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            // If user is not logged in, we shouldn't show this or should handle plain copy link
            try {
                const res = await api.get('/api/users/all');
                setUsers(res.data.filter(u => u.id !== user?.id)); // Remove self
            } catch (err) {
                console.error("Failed to load users for sharing", err);
                showToast("Erro ao carregar lista de usuários", "error");
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, [user, showToast]);

    const handleShare = async (targetUserId) => {
        setSending(targetUserId);
        try {
            // Include video link in the message
            const videoLink = `https://sinopinhas.vercel.app/?v=${video.id}`;
            const msg = `Veja este vídeo: ${video.title}\n\n[VIDEO_LINK:${video.id}]\n${videoLink}`;

            await api.post('/api/send-message', {
                from_id: user.id,
                to_id: targetUserId,
                msg: msg
            });

            showToast("Vídeo enviado com sucesso!", "success");
            onClose();
        } catch (err) {
            console.error(err);
            showToast("Erro ao enviar vídeo.", "error");
            setSending(null);
        }
    };

    const handleCopyLink = () => {
        const videoLink = `https://sinopinhas.vercel.app/?v=${video.id}`;
        navigator.clipboard.writeText(videoLink);
        showToast("Link copiado para a área de transferência!", "success");
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card-bg)', borderRadius: 16, padding: 24,
                width: '100%', maxWidth: 400, border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                transition: 'background 0.3s ease, border-color 0.3s ease'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, color: 'var(--text-color)' }}>Enviar "{video.title}"</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 24, cursor: 'pointer' }}>×</button>
                </div>

                <button onClick={handleCopyLink} style={{
                    width: '100%', padding: 12, borderRadius: 8,
                    background: 'var(--input-bg)', border: '1px solid var(--border-color)', color: 'var(--text-color)',
                    marginBottom: 16, cursor: 'pointer', fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                }}>
                    🔗 Copiar Link
                </button>

                <input
                    type="text"
                    placeholder="Buscar usuário..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{
                        width: '100%', padding: 12, borderRadius: 8,
                        background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                        color: 'var(--text-color)', marginBottom: 12,
                        outline: 'none'
                    }}
                />

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: 'var(--secondary-text)' }}>Carregando...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--secondary-text)' }}>Nenhum usuário encontrado.</div>
                    ) : (
                        filteredUsers.map(u => (
                            <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: 10, background: 'var(--input-bg)', borderRadius: 8, marginBottom: 8,
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'var(--accent-color)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', overflow: 'hidden'
                                }}>
                                    {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                                </div>
                                <span style={{ color: 'var(--text-color)', flex: 1 }}>{u.username}</span>
                                <button
                                    onClick={() => handleShare(u.id)}
                                    disabled={sending === u.id}
                                    style={{
                                        background: sending === u.id ? '#666' : 'var(--accent-color)',
                                        color: '#fff', border: 'none', borderRadius: 6,
                                        padding: '6px 12px', cursor: 'pointer', fontSize: 13,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {sending === u.id ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

    );
}
