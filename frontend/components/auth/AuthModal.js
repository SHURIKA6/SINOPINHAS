import { useState } from 'react';
import { loginUser, registerUser } from '../../services/api';
import { X } from 'lucide-react';

// Componente Modal de Autenticação (Login e Cadastro) estilo Windows XP
export default function AuthModal({ onClose, onAuthSuccess, showToast }) {
    // Estados para controlar o modo (Login/Cadastro) e os campos do formulário
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Função que manipula o envio do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validação simples dos campos
        if (!username || !password) return showToast('Preencha todos os campos', 'error');

        try {
            let data;
            // Alterna entre a chamada de API de Login ou Registro
            if (isLogin) {
                data = await loginUser(username, password);
            } else {
                data = await registerUser(username, password);
            }

            // Callback de sucesso e notificação
            onAuthSuccess(data.user);
            showToast(isLogin ? 'Login realizado!' : 'Conta criada!', 'success');
            onClose();
        } catch (err) {
            showToast(err.response?.data?.error || 'Erro ao autenticar', 'error');
        }
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
                        {isLogin ? 'Login' : 'Criar Conta'}
                    </span>
                    {/* Botão Fechar (X) estilo XP */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <img src="/icons/icon-192x192.png" width="48" height="48" alt="Logo" style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))' }} />
                        <div style={{ fontSize: '12px', color: '#444' }}>
                            Digite seu nome de usuário e senha para ter acesso ao sistema.
                        </div>
                    </div>

                    {/* Formulário de Credenciais */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label htmlFor="auth-username" style={{ fontSize: '11px', color: '#333' }}>Usuário:</label>
                            <input
                                id="auth-username"
                                type="text"
                                value={username} onChange={e => setUsername(e.target.value)}
                                autoComplete="username"
                                aria-required="true"
                                style={{
                                    border: '1px solid #7F9DB9', padding: '4px', fontSize: '13px'
                                }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label htmlFor="auth-password" style={{ fontSize: '11px', color: '#333' }}>Senha:</label>
                            <input
                                id="auth-password"
                                type="password"
                                value={password} onChange={e => setPassword(e.target.value)}
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                aria-required="true"
                                style={{
                                    border: '1px solid #7F9DB9', padding: '4px', fontSize: '13px'
                                }}
                            />
                        </div>

                        {/* Botões de Ação (Alternar modo e Submeter) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                style={{
                                    minWidth: '75px', height: '23px', fontSize: '11px',
                                    background: '#ECE9D8', border: '1px solid #7F9DB9', borderRadius: '3px', cursor: 'pointer',
                                    color: 'black'
                                }}
                            >
                                {isLogin ? 'Criar conta...' : 'Voltar'}
                            </button>
                            <button
                                type="submit"
                                style={{
                                    minWidth: '75px', height: '23px', fontSize: '11px',
                                    background: '#ECE9D8', border: '1px solid #003C74', borderRadius: '3px', cursor: 'pointer',
                                    color: 'black', boxShadow: 'inset 1px 1px 0 white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
