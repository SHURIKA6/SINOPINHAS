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
                background: '#1a1a1a', borderRadius: 16, padding: 24,
                width: '100%', maxWidth: 400, border: '1px solid #333'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, color: '#fff' }}>Enviar "{video.title}"</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 24, cursor: 'pointer' }}>×</button>
                </div>

                <button onClick={handleCopyLink} style={{
                    width: '100%', padding: 12, borderRadius: 8,
                    background: '#333', border: 'none', color: '#fff',
                    marginBottom: 16, cursor: 'pointer', fontWeight: 'bold'
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
                        background: '#2a2a2a', border: '1px solid #444',
                        color: 'white', marginBottom: 12
                    }}
                />

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#ccc' }}>Carregando...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666' }}>Nenhum usuário encontrado.</div>
                    ) : (
                        filteredUsers.map(u => (
                            <div key={u.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: 10, background: '#252525', borderRadius: 8, marginBottom: 8
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: '#8d6aff', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', overflow: 'hidden'
                                }}>
                                    {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username[0].toUpperCase()}
                                </div>
                                <span style={{ color: '#fff', flex: 1 }}>{u.username}</span>
                                <button
                                    onClick={() => handleShare(u.id)}
                                    disabled={sending === u.id}
                                    style={{
                                        background: sending === u.id ? '#666' : '#8d6aff',
                                        color: '#fff', border: 'none', borderRadius: 6,
                                        padding: '6px 12px', cursor: 'pointer', fontSize: 13
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
