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
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#002244', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                            {achievement.icon} {achievement.label}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#0047AB', fontSize: 13, fontWeight: 600 }}>
                            Usuários com esta conquista
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#0047AB', fontSize: 20, cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="spinner"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#445566', padding: 20, fontStyle: 'italic' }}>Ninguém ganhou esta conquista ainda.</p>
                    ) : (
                        users.map(u => (
                            <div
                                key={u.id}
                                onClick={() => onUserClick(u.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                    background: 'rgba(255, 255, 255, 0.4)', borderRadius: 16, cursor: 'pointer',
                                    border: '1px solid rgba(255, 255, 255, 0.6)', transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0, 71, 171, 0.05)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.borderColor = '#0078D4';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                                }}
                            >
                                {u.avatar ? (
                                    <img src={u.avatar} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)' }} alt={u.username} />
                                ) : (
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0078D4, #005A9E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: 'white', border: '2px solid rgba(255,255,255,0.8)' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: '#002244' }}>{u.username}</div>
                                    <div style={{ fontSize: 12, color: '#0047AB', fontWeight: 500 }}>Ver perfil</div>
                                </div>
                                <div style={{ fontSize: 20, color: '#0078D4' }}>→</div>
                            </div>
                        ))
                    )}
                </div>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(255, 255, 255, 0.1); z-index: 10000; display: flex;
                        align-items: center; justifyContent: center; padding: 20px;
                        backdrop-filter: blur(8px);
                    }
                    .modal-content {
                        background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%);
                        border-radius: 24px; padding: 32px;
                        maxWidth: 440px; width: 100%;
                        maxHeight: 90vh;
                        border: 1px solid rgba(255, 255, 255, 0.9);
                        box-shadow: 0 25px 50px -12px rgba(0, 71, 171, 0.25), inset 0 1px 0 rgba(255,255,255,0.8);
                        animation: fadeIn 0.3s ease-out;
                    }
                    .spinner {
                        width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.5);
                        border-top: 4px solid #0078D4; border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>
            </div>
        </div>
    );
}
