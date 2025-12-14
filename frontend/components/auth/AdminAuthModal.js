import { useState } from 'react';
import { loginAdmin } from '../../services/api';

export default function AdminAuthModal({ onClose, onAdminAuthSuccess, showToast }) {
    const [adminPassword, setAdminPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await loginAdmin(adminPassword);
            if (res.success) {
                onAdminAuthSuccess(adminPassword);
                showToast('Acesso admin concedido!', 'success');
                onClose();
            }
        } catch (err) {
            showToast('Senha admin incorreta', 'error');
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
                <h2 style={{ margin: '0 0 24px' }}>🔒 Acesso Admin</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password" placeholder="Senha de admin"
                        value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                        Entrar como Admin
                    </button>
                </form>
            </div>
        </div>
    );
}
