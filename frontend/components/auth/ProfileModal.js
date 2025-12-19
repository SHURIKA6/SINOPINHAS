import { useState } from 'react';
import { updateUserProfile } from '../../services/api';

export default function ProfileModal({ user, setUser, onClose, showToast }) {
    const [newAvatar, setNewAvatar] = useState(user.avatar || '');
    const [newBio, setNewBio] = useState(user.bio || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            const updates = {};
            if (newAvatar !== user.avatar) updates.avatar = newAvatar;
            if (newBio !== user.bio) updates.bio = newBio;

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    return showToast('As senhas não coincidem', 'error');
                }
                if (newPassword.length < 6) {
                    return showToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
                }
                if (!currentPassword) {
                    return showToast('Digite sua senha atual para autorizar a mudança', 'error');
                }
                updates.password = newPassword;
                updates.currentPassword = currentPassword;
            }

            if (Object.keys(updates).length === 0) {
                return showToast('Nenhuma alteração feita', 'error');
            }

            const res = await updateUserProfile(user.id, updates);
            const updatedUser = { ...user, ...res.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Limpa campos de senha
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            onClose();
            showToast('Perfil atualizado!', 'success');
        } catch (err) {
            showToast(err.message || 'Erro ao atualizar perfil', 'error');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div
                className="glass"
                style={{
                    borderRadius: 24, padding: 32,
                    maxWidth: 440, width: '100%',
                    maxHeight: '90vh', overflowY: 'auto',
                    color: 'var(--text-color)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>✏️ Editar Perfil</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: 20 }}>✕</button>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🏆 Suas Conquistas</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Badge icon="⭐" label="Pioneiro" color="#fbbf24" />
                        <Badge icon="🎬" label="Criador" color="#8d6aff" />
                        <Badge icon="🏙️" label="Sinopense" color="#10b981" />
                    </div>
                </div>

                <form onSubmit={updateProfile}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Avatar (URL)</label>
                    <input
                        type="text" placeholder="https://..."
                        value={newAvatar} onChange={e => setNewAvatar(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                    />

                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sobre você</label>
                    <textarea
                        placeholder="Conte um pouco sobre você..."
                        value={newBio} onChange={e => setNewBio(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', resize: 'vertical', fontSize: 16, outline: 'none' }}
                    />

                    <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0 16px' }} />
                    <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🛡️ Segurança</p>

                    <input
                        type="password" placeholder="Senha Atual"
                        value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                    />
                    <input
                        type="password" placeholder="Nova Senha"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                    />
                    <input
                        type="password" placeholder="Confirmar Nova Senha"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 24, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-color)', fontSize: 16, outline: 'none' }}
                    />

                    <button type="submit" style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(141, 106, 255, 0.3)' }}>
                        Atualizar Perfil
                    </button>
                </form>
            </div>
        </div>
    );
}

function Badge({ icon, label, color }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: `${color}15`,
            border: `1px solid ${color}30`,
            padding: '6px 12px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            color: color
        }}>
            <span>{icon}</span> {label}
        </div>
    );
}
