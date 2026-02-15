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
        <div role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" style={{
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
                <h2 id="admin-modal-title" style={{ margin: '0 0 24px' }}>🛡️ Painel Admin</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="admin-password" className="sr-only">Senha de Administrador</label>
                    <input
                        id="admin-password"
                        type="password"
                        placeholder="Senha de Administrador"
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        autoComplete="current-password"
                        aria-required="true"
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-color)', fontSize: 16 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                        Acessar como Admin
                    </button>
                </form>
            </div>
        </div>
    );
}
