import { useState, useEffect } from 'react';
import { fetchUsersByAchievement } from '../../services/api';

export default function AchievementUsersModal({ achievement, onClose, onUserClick }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (achievement) loadUsers();
    }, [achievement]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await fetchUsersByAchievement(achievement.type);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="glass modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
                            {achievement.icon} {achievement.label}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--secondary-text)', fontSize: 13 }}>
                            Usuários com esta conquista
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 20, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="spinner"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--secondary-text)', padding: 20 }}>Ninguém ganhou esta conquista ainda.</p>
                    ) : (
                        users.map(u => (
                            <div
                                key={u.id}
                                onClick={() => onUserClick(u.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                    background: 'var(--input-bg)', borderRadius: 16, cursor: 'pointer',
                                    border: '1px solid var(--border-color)', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                {u.avatar ? (
                                    <img src={u.avatar} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt={u.username} />
                                ) : (
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{u.username}</div>
                                    <div style={{ fontSize: 12, color: 'var(--secondary-text)' }}>Ver perfil</div>
                                </div>
                                <div style={{ fontSize: 20 }}>→</div>
                            </div>
                        ))
                    )}
                </div>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.85); z-index: 10000; display: flex;
                        align-items: center; justifyContent: center; padding: 20px;
                        backdrop-filter: blur(8px);
                    }
                    .modal-content {
                        border-radius: 24px; padding: 32px;
                        maxWidth: 440px; width: 100%;
                        maxHeight: 90vh;
                        color: var(--text-color);
                        boxShadow: 0 20px 50px rgba(0,0,0,0.5);
                        animation: fadeIn 0.3s ease-out;
                    }
                    .spinner {
                        width: 40px; height: 40px; border: 4px solid var(--border-color);
                        border-top: 4px solid var(--accent-color); border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        </div>
    );
}
