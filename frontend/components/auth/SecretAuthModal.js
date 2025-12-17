import { useState } from 'react';

export default function SecretAuthModal({ onClose, onSecretAuthSuccess, showToast }) {
    const [secretPassword, setSecretPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (secretPassword === '0000') {
            onSecretAuthSuccess();
            showToast('Acesso liberado!', 'success');
            onClose();
        } else {
            showToast('Senha Incorreta.', 'error');
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
                <h2 style={{ margin: '0 0 24px' }}>🔒 VÍDEOS SAPECAS</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password" placeholder="MESMA SENHA DA SKY"
                        value={secretPassword}
                        onChange={e => setSecretPassword(e.target.value)}
                        style={{
                            width: '100%', padding: 12, marginBottom: 16,
                            background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                            borderRadius: 8, color: 'var(--text-color)', fontSize: 16
                        }}
                    />
                    <button type="submit" style={{
                        width: '100%', padding: 12, background: '#e53e3e',
                        color: '#fff', border: 'none', borderRadius: 8,
                        fontSize: 16, fontWeight: 600, cursor: 'pointer'
                    }}>
                        Liberar Acesso
                    </button>
                </form>
            </div>
        </div>

    );
}
