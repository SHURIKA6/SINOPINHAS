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
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card-bg)', borderRadius: 12, padding: 32,
                maxWidth: 400, width: '100%',
                border: '1px solid var(--border-color)',
                color: 'var(--text-color)',
                transition: 'background 0.3s ease, border-color 0.3s ease'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 24px' }}>✏️ Editar Perfil</h2>
                <form onSubmit={updateProfile}>
                    <input
                        type="text" placeholder="URL do Avatar"
                        value={newAvatar} onChange={e => setNewAvatar(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', fontSize: 16 }}
                    />
                    <textarea
                        placeholder="Bio"
                        value={newBio} onChange={e => setNewBio(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', resize: 'vertical', fontSize: 16 }}
                    />
                    <div style={{ height: 1, background: 'var(--border-color)', margin: '24px 0 16px' }} />
                    <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12, fontWeight: 600 }}>🛡️ Alterar Senha</p>

                    <input
                        type="password" placeholder="Senha Atual (obrigatório para mudar)"
                        value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', fontSize: 16 }}
                    />
                    <input
                        type="password" placeholder="Nova Senha"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', fontSize: 16 }}
                    />
                    <input
                        type="password" placeholder="Confirmar Nova Senha"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', fontSize: 16 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: 12, background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                        Salvar Alterações
                    </button>
                </form>
            </div>
        </div>

    );
}
