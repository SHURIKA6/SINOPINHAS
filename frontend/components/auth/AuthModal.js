import { useState } from 'react';
import { loginUser, registerUser } from '../../services/api';

export default function AuthModal({ onClose, onAuthSuccess, showToast }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return showToast('Preencha todos os campos', 'error');

        try {
            let data;
            if (isLogin) {
                data = await loginUser(username, password);
            } else {
                data = await registerUser(username, password);
            }

            onAuthSuccess(data.user);
            showToast(isLogin ? 'Login realizado!' : 'Conta criada!', 'success');
            onClose();
        } catch (err) {
            showToast(err.response?.data?.error || 'Erro ao autenticar', 'error');
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
                <h2 style={{ margin: '0 0 24px' }}>{isLogin ? 'Login' : 'Criar Conta'}</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text" placeholder="Username"
                        value={username} onChange={e => setUsername(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                    />
                    <input
                        type="password" placeholder="Senha"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                    />
                    <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, marginBottom: 16, cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                        {isLogin ? 'Entrar' : 'Criar Conta'}
                    </button>
                    <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: 12, background: 'none', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        {isLogin ? 'Criar conta' : 'Fazer login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
