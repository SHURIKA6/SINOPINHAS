import { useState } from 'react';
import { updateUserProfile } from '../../services/api';

export default function ProfileModal({ user, setUser, onClose, showToast }) {
    const [newAvatar, setNewAvatar] = useState(user.avatar || '');
    const [newBio, setNewBio] = useState(user.bio || '');
    const [newPassword, setNewPassword] = useState('');

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            const updates = {};
            if (newPassword) updates.password = newPassword;
            if (newAvatar !== user.avatar) updates.avatar = newAvatar;
            if (newBio !== user.bio) updates.bio = newBio;

            if (Object.keys(updates).length === 0) {
                return showToast('Nenhuma alteração feita', 'error');
            }

            const res = await updateUserProfile(user.id, updates);
            const updatedUser = { ...user, ...res.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setNewPassword('');
            onClose();
            showToast('Perfil atualizado!', 'success');
        } catch (err) {
            showToast('Erro ao atualizar perfil', 'error');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: '#1a1a1a', borderRadius: 12, padding: 32,
                maxWidth: 400, width: '100%'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 24px' }}>✏️ Editar Perfil</h2>
                <form onSubmit={updateProfile}>
                    <input
                        type="text" placeholder="URL do Avatar"
                        value={newAvatar} onChange={e => setNewAvatar(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                    />
                    <textarea
                        placeholder="Bio"
                        value={newBio} onChange={e => setNewBio(e.target.value)}
                        rows="3"
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', resize: 'vertical', fontSize: 16 }}
                    />
                    <input
                        type="password" placeholder="Nova Senha (deixe vazio para não alterar)"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                        Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    );
}
