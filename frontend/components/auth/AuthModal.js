import { useState, useMemo } from 'react';
import { loginUser, registerUser, requestPasswordReset, resetPassword } from '../../services/api';
import { X, Eye, EyeOff, KeyRound } from 'lucide-react';

// Helper: Calcular força da senha
function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: '', color: '#ccc' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
        { label: 'Muito fraca', color: '#FF3B30' },
        { label: 'Fraca', color: '#FF9500' },
        { label: 'Razoável', color: '#FFD60A' },
        { label: 'Boa', color: '#34C759' },
        { label: 'Forte', color: '#00C7BE' },
    ];
    const idx = Math.min(score, levels.length) - 1;
    return idx < 0
        ? { score: 0, label: '', color: '#ccc' }
        : { score, label: levels[idx].label, color: levels[idx].color };
}

// Componente Modal de Autenticação (Login, Cadastro, Esqueci senha) estilo Windows XP
export default function AuthModal({ onClose, onAuthSuccess, showToast }) {
    // 'login' | 'register' | 'forgot' | 'reset'
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const strength = useMemo(() => getPasswordStrength(password), [password]);
    const newStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

    // Submit principal (login ou register)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return showToast('Preencha todos os campos', 'error');

        // Validação de senha no registro
        if (mode === 'register') {
            if (password.length < 6) {
                return showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            }
        }

        setLoading(true);
        try {
            let data;
            if (mode === 'login') {
                data = await loginUser(username, password);
            } else {
                data = await registerUser(username, password);
            }
            onAuthSuccess(data.user);
            showToast(mode === 'login' ? 'Login realizado!' : 'Conta criada!', 'success');
            onClose();
        } catch (err) {
            showToast(err.message || 'Erro ao autenticar', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Solicitar recuperação de senha
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!username) return showToast('Digite seu nome de usuário', 'error');

        setLoading(true);
        try {
            const data = await requestPasswordReset(username);
            showToast(data.message, 'success');
            // Se tiver token retornado (modo sem e-mail), preencher automaticamente
            if (data.reset_token) {
                setResetToken(data.reset_token);
                setMode('reset');
            }
        } catch (err) {
            showToast(err.message || 'Erro ao solicitar recuperação', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Resetar senha com token
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetToken || !newPassword) return showToast('Preencha todos os campos', 'error');
        if (newPassword.length < 6) return showToast('A nova senha deve ter pelo menos 6 caracteres', 'error');

        setLoading(true);
        try {
            const data = await resetPassword(resetToken, newPassword);
            showToast(data.message, 'success');
            setMode('login');
            setPassword('');
            setResetToken('');
            setNewPassword('');
        } catch (err) {
            showToast(err.message || 'Erro ao resetar senha', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Login';
            case 'register': return 'Criar Conta';
            case 'forgot': return 'Esqueci minha senha';
            case 'reset': return 'Nova senha';
            default: return 'Autenticação';
        }
    };

    const inputStyle = {
        border: '1px solid #7F9DB9', padding: '4px', fontSize: '13px', width: '100%', boxSizing: 'border-box'
    };

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>

            {/* Janela de Diálogo Estilo Clássico do Windows XP */}
            <div style={{
                width: '380px',
                background: '#ECE9D8',
                border: '1px solid #0055EA',
                borderRadius: '8px 8px 0 0',
                boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
                fontFamily: 'Tahoma, sans-serif',
                display: 'flex', flexDirection: 'column'
            }} onClick={e => e.stopPropagation()}>

                {/* Barra de Título com Degradê Azul */}
                <div style={{
                    height: '30px',
                    background: 'linear-gradient(to bottom, #0058EE 0%, #3593FF 4%, #288EFF 18%, #127DFF 20%, #0369FC 39%, #0262EE 41%, #0057E5 100%)',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 8px', borderBottom: '1px solid #003C74',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}>
                    <span id="auth-modal-title" style={{ color: 'white', fontWeight: 'bold', fontSize: '13px', textShadow: '1px 1px 0 black' }}>
                        {getTitle()}
                    </span>
                    <div
                        onClick={onClose}
                        style={{
                            width: '21px', height: '21px', background: '#D8412F', borderRadius: '3px',
                            border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                        }}
                    >
                        <X size={14} color="white" strokeWidth={3} />
                    </div>
                </div>

                {/* Corpo do Conteúdo da Janela */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* Cabeçalho com Ícone e Instrução */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                        {mode === 'forgot' || mode === 'reset' ? (
                            <KeyRound size={40} color="#0047AB" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))' }} />
                        ) : (
                            <img src="/icons/icon-192x192.png" width="48" height="48" alt="Logo" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))' }} />
                        )}
                        <div style={{ fontSize: '12px', color: '#444' }}>
                            {mode === 'login' && 'Digite seu nome de usuário e senha para ter acesso ao sistema.'}
                            {mode === 'register' && 'Escolha um nome de usuário e crie uma senha segura.'}
                            {mode === 'forgot' && 'Digite seu nome de usuário para solicitar a recuperação.'}
                            {mode === 'reset' && 'O código de recuperação foi preenchido. Defina sua nova senha.'}
                        </div>
                    </div>

                    {/* --- Formulário de Login/Register --- */}
                    {(mode === 'login' || mode === 'register') && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="auth-username" style={{ fontSize: '11px', color: '#333' }}>Usuário:</label>
                                <input
                                    id="auth-username"
                                    type="text"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    autoComplete="username"
                                    aria-required="true"
                                    style={inputStyle}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="auth-password" style={{ fontSize: '11px', color: '#333' }}>Senha:</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="auth-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        aria-required="true"
                                        style={{ ...inputStyle, paddingRight: '28px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                                        }}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={14} color="#999" /> : <Eye size={14} color="#999" />}
                                    </button>
                                </div>
                            </div>

                            {/* Barra de força (somente no registro) */}
                            {mode === 'register' && password && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{
                                        height: '4px', borderRadius: '2px',
                                        background: '#e0e0e0', overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${(strength.score / 5) * 100}%`,
                                            height: '100%',
                                            background: strength.color,
                                            borderRadius: '2px',
                                            transition: 'all 0.3s ease',
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '10px', color: strength.color, fontWeight: 600 }}>
                                        {strength.label}
                                    </span>
                                    {password.length < 6 && (
                                        <span style={{ fontSize: '10px', color: '#FF3B30' }}>
                                            Mínimo 6 caracteres
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Link "Esqueci minha senha" (só no login) */}
                            {mode === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot')}
                                    style={{
                                        background: 'none', border: 'none', color: '#0047AB',
                                        fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                                        textAlign: 'left', padding: 0,
                                    }}
                                >
                                    Esqueci minha senha
                                </button>
                            )}

                            {/* Botões de Ação */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                                    style={{
                                        minWidth: '75px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #7F9DB9', borderRadius: '3px', cursor: 'pointer',
                                        color: 'black'
                                    }}
                                >
                                    {mode === 'login' ? 'Criar conta...' : 'Voltar'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        minWidth: '75px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #003C74', borderRadius: '3px', cursor: 'pointer',
                                        color: 'black', boxShadow: 'inset 1px 1px 0 white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    {loading ? '...' : 'OK'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- Formulário: Esqueci minha senha --- */}
                    {mode === 'forgot' && (
                        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="forgot-username" style={{ fontSize: '11px', color: '#333' }}>Nome de usuário:</label>
                                <input
                                    id="forgot-username"
                                    type="text"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    autoComplete="username"
                                    style={inputStyle}
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    style={{
                                        minWidth: '75px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #7F9DB9', borderRadius: '3px', cursor: 'pointer',
                                        color: 'black'
                                    }}
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        minWidth: '75px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #003C74', borderRadius: '3px',
                                        cursor: 'pointer', color: 'black', opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    {loading ? '...' : 'Solicitar'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- Formulário: Nova senha (com token) --- */}
                    {mode === 'reset' && (
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="reset-token" style={{ fontSize: '11px', color: '#333' }}>Código de recuperação:</label>
                                <input
                                    id="reset-token"
                                    type="text"
                                    value={resetToken} onChange={e => setResetToken(e.target.value)}
                                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '11px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label htmlFor="reset-new-password" style={{ fontSize: '11px', color: '#333' }}>Nova senha:</label>
                                <input
                                    id="reset-new-password"
                                    type="password"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    style={inputStyle}
                                />
                                {newPassword && (
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{
                                            height: '4px', borderRadius: '2px',
                                            background: '#e0e0e0', overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${(newStrength.score / 5) * 100}%`,
                                                height: '100%',
                                                background: newStrength.color,
                                                borderRadius: '2px',
                                                transition: 'all 0.3s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '10px', color: newStrength.color, fontWeight: 600 }}>
                                            {newStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '5px' }}>
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    style={{
                                        minWidth: '75px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #7F9DB9', borderRadius: '3px', cursor: 'pointer',
                                        color: 'black'
                                    }}
                                >
                                    Voltar ao login
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        minWidth: '90px', height: '23px', fontSize: '11px',
                                        background: '#ECE9D8', border: '1px solid #003C74', borderRadius: '3px',
                                        cursor: 'pointer', color: 'black', opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    {loading ? '...' : 'Salvar senha'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
