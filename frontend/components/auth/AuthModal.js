import { useState } from 'react';
import { loginUser, registerUser } from '../../services/api';
import { User, ArrowRight, X, HelpCircle, Power } from 'lucide-react';

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
            background: '#003399', zIndex: 9999, display: 'flex', flexDirection: 'column'
        }} onClick={(e) => e.stopPropagation()}>

            {/* XP Top Bar */}
            <div style={{
                height: '80px', background: 'linear-gradient(to bottom, #003399 0%, #003399 100%)',
                borderBottom: '2px solid #F26600', display: 'flex', alignItems: 'center', padding: '0 40px',
                position: 'relative'
            }}>
                <div style={{
                    width: '100%', height: '50%', position: 'absolute', top: 0, left: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
                }}></div>
                <span style={{
                    fontFamily: 'Tahoma, sans-serif', fontSize: '24px', fontWeight: 'bold', color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>
                    Microsoft Windows <sup style={{ fontSize: '12px' }}>XP</sup>
                </span>
            </div>

            {/* Main Split Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 40, width: '100%', maxWidth: '800px',
                    position: 'relative'
                }}>
                    {/* Left: Welcome Text */}
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '40px', borderRight: '1px solid rgba(255,255,255,0.3)' }}>
                        <div style={{
                            fontFamily: 'Tahoma, sans-serif', fontSize: '42px', fontWeight: 'bold',
                            color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', fontStyle: 'italic',
                            background: 'linear-gradient(to right, #FFFFFF, #B9C9E8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            {isLogin ? 'Bem-vindo' : 'Criar conta'}
                        </div>
                        <div style={{ color: '#ADC9FF', fontSize: '14px', marginTop: '10px' }}>
                            {isLogin ? 'Clique no usuário para começar' : 'Preencha os dados ao lado'}
                        </div>
                    </div>

                    {/* Right: User Login Tile */}
                    <div style={{ flex: 1, paddingLeft: '20px' }}>
                        <div className="xp-user-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            {/* Avatar Frame */}
                            <div style={{
                                width: '64px', height: '64px', background: '#FFD700', borderRadius: '4px', border: '2px solid white',
                                boxShadow: '2px 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <User size={40} color="white" strokeWidth={1.5} />
                            </div>

                            {/* Inputs */}
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'white', fontSize: '18px', marginBottom: '8px', cursor: 'pointer', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                    onClick={() => document.getElementById('username-input')?.focus()}>
                                    {username || 'Usuário'}
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        id="username-input"
                                        type="text"
                                        placeholder="Nome de usuário"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        style={{
                                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #7F9DB9',
                                            fontSize: '14px', width: '200px', outline: 'none',
                                            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                        autoFocus
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="password"
                                            placeholder="Senha"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', border: '1px solid #7F9DB9',
                                                fontSize: '14px', width: '200px', outline: 'none',
                                                boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <button type="submit" style={{
                                            background: 'linear-gradient(to bottom, #4CAF50, #2E7D32)',
                                            border: '1px solid #1B5E20', borderRadius: '4px', padding: '4px 8px',
                                            cursor: 'pointer', boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </form>

                                <div style={{ marginTop: '10px' }}>
                                    <span
                                        onClick={() => setIsLogin(!isLogin)}
                                        style={{
                                            color: 'white', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer',
                                            textShadow: '1px 1px 1px rgba(0,0,0,0.5)', opacity: 0.8
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = 1}
                                        onMouseLeave={(e) => e.target.style.opacity = 0.8}
                                    >
                                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{
                height: '60px', background: 'linear-gradient(to bottom, #003399 0%, #001f5c 100%)',
                borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 40px'
            }}>
                <button onClick={onClose} style={{
                    background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                    color: 'white', fontSize: '14px', cursor: 'pointer', opacity: 0.8
                }}>
                    <div style={{
                        width: '24px', height: '24px',
                        background: 'radial-gradient(circle, #E04E39 0%, #B52C1C 100%)',
                        border: '2px solid white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Power size={14} color="white" />
                    </div>
                    <span>Desligar o Sinopinhas</span>
                </button>

                <div style={{ color: 'white', fontSize: '12px', opacity: 0.5 }}>
                    Para ajuda clique aqui ou pressione F1.
                </div>
            </div>

            <style jsx>{`
                ::placeholder { color: #aaa; font-style: italic; }
            `}</style>
        </div>
    );
}
