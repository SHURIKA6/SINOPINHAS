import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock, Shield, Eye, Cpu, AlertTriangle, ChevronRight, Binary } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { discoverLogs } from '../services/api';

export default function ShuraLogs() {
    const [text, setText] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const router = useRouter();

    const secretContent = `
> [SISTEMA_INICIALIZADO_V3.2]
> ACESSO_AUTORIZADO: NIVEL_SHURA
> DATA: ${new Date().toLocaleDateString()}
> STATUS: ESTÁVEL

Olá, explorador. Se você chegou aqui através dos comandos no console, você tem o olhar apurado e a curiosidade que define um verdadeiro desenvolvedor.

Aqui é onde guardamos as notas de desenvolvimento e segredos que a maioria nunca verá.

-- NOTAS DE SISTEMA --
1. A API de Push foi corrigida para usar Endpoints únicos.
2. O banco Neon está operando em modo Serverless para máxima escalabilidade.
3. O design está sendo refinado para entregar uma experiência premium.

-- REFLEXÕES DO DEV --
Sabe, estou fazendo esse site para encher minha mente com algo.
Ultimamente, não tenho muito que fazer, e pensamentos pesados vieram a minha cabeça. 
É melhor perder tempo com um site aleatório do que perder o resto de uma vida, né?

Se você está lendo isso, você é curioso pra krl. E a curiosidade é o que move a inovação.
Continue explorando, continue questionando.

-- FIM DA TRANSMISSÃO --
    `;

    useEffect(() => {
        let i = 0;
        if (isAuthenticated) {
            const interval = setInterval(() => {
                setText(secretContent.slice(0, i));
                i++;
                if (i > secretContent.length) clearInterval(interval);
            }, 25);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const { user, setUser } = useAuth(() => { });

    const handleLogin = async (e) => {
        e.preventDefault();
        const normalized = password.toLowerCase();
        if (normalized === 'shura' || normalized === 'sinopinhas') {
            setIsAuthenticated(true);
            if (user && !user.discovered_logs) {
                try {
                    const res = await discoverLogs(user.id);
                    if (res.data) {
                        const updated = { ...user, ...res.data };
                        setUser(updated);
                        localStorage.setItem('user', JSON.stringify(updated));
                    }
                } catch (err) {
                    console.error("Failed to unlock achievement:", err);
                }
            }
        } else {
            setIsError(true);
            setTimeout(() => setIsError(false), 2000);
        }
    };


    return (
        <div className="terminal-page">
            <Head>
                <title>SECURE_SHELL // SHURA</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* Scanline Overlay */}
            <div className="scanlines" />
            <div className="noise" />

            <div className="terminal-container">
                <AnimatePresence mode="wait">
                    {!isAuthenticated ? (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="login-card"
                        >
                            <div className="card-header">
                                <Binary size={20} />
                                <span>SINOPINHAS_OS // AUTH</span>
                            </div>

                            <div className="card-content">
                                <motion.div
                                    animate={isError ? { x: [-5, 5, -5, 5, 0] } : {}}
                                    className="security-icon"
                                >
                                    {isError ? <AlertTriangle size={64} color="#ef4444" /> : <Shield size={64} />}
                                </motion.div>

                                <h1>ACESSO RESTRITO</h1>
                                <p>Insira a chave de criptografia para prosseguir.</p>

                                <form onSubmit={handleLogin} className="login-form">
                                    <div className={`input-wrapper ${isError ? 'error' : ''}`}>
                                        <Lock size={18} className="input-icon" />
                                        <input
                                            type="password"
                                            placeholder="ENCRYPT_KEY"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button type="submit" className="login-btn">
                                        DESCRIPTOGRAFAR_LOGS
                                    </button>
                                </form>

                                <button
                                    onClick={() => router.push('/')}
                                    className="back-link"
                                >
                                    &lt; STATUS_ABORT &gt;
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="terminal-window"
                        >
                            <div className="window-header">
                                <div className="header-left">
                                    <Terminal size={16} />
                                    <span>shura@sinopinhas_os:~/home/logs</span>
                                </div>
                                <div className="header-tabs">
                                    <div className="tab active">secret_notes.log</div>
                                    <div className="tab">system_dump</div>
                                </div>
                                <div className="header-controls">
                                    <div className="dot" />
                                    <div className="dot" />
                                    <div className="dot" />
                                </div>
                            </div>

                            <div className="window-body">
                                <div className="content-scroll">
                                    <div className="terminal-text">
                                        {text}
                                        <motion.span
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="cursor"
                                        />
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 3 }}
                                        className="system-stats"
                                    >
                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <Cpu size={14} />
                                                <span>CPU_LOAD</span>
                                            </div>
                                            <div className="progress-bar">
                                                <motion.div
                                                    animate={{ width: ['30%', '85%', '45%', '95%', '60%'] }}
                                                    transition={{ duration: 4, repeat: Infinity }}
                                                    className="progress-fill"
                                                />
                                            </div>
                                        </div>

                                        <div className="stat-card">
                                            <div className="stat-header">
                                                <Eye size={14} />
                                                <span>WATCHER_ID</span>
                                            </div>
                                            <div className="stat-value">SH-XXXX-8821</div>
                                        </div>
                                    </motion.div>

                                    <div className="terminal-footer">
                                        <ChevronRight size={14} className="prompt-icon" />
                                        <span className="prompt-text">Aguardando novo comando...</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

                :root {
                    --neon-green: #00ff41;
                    --neon-glow: rgba(0, 255, 65, 0.3);
                    --dark-bg: #050505;
                    --card-bg: rgba(15, 15, 15, 0.8);
                }

                .terminal-page {
                    background-color: var(--dark-bg);
                    color: var(--neon-green);
                    min-height: 100vh;
                    font-family: 'JetBrains+Mono', 'Courier New', monospace;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Effects */
                .scanlines {
                    position: fixed;
                    inset: 0;
                    background: linear-gradient(
                        to bottom,
                        rgba(18, 16, 16, 0) 50%,
                        rgba(0, 0, 0, 0.1) 50%
                    );
                    background-size: 100% 4px;
                    z-index: 10;
                    pointer-events: none;
                }

                .noise {
                    position: fixed;
                    inset: 0;
                    background: url('https://grainy-gradients.vercel.app/noise.svg');
                    opacity: 0.05;
                    z-index: 11;
                    pointer-events: none;
                }

                .terminal-container {
                    position: relative;
                    z-index: 20;
                    width: 100%;
                    max-width: 900px;
                    padding: 20px;
                }

                /* Login Card */
                .login-card {
                    background: var(--card-bg);
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 255, 65, 0.05);
                    backdrop-filter: blur(10px);
                    max-width: 400px;
                    margin: 0 auto;
                }

                .card-header {
                    background: rgba(0, 255, 65, 0.1);
                    padding: 10px 20px;
                    border-bottom: 1px solid rgba(0, 255, 65, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }

                .card-content {
                    padding: 40px 30px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .security-icon {
                    margin-bottom: 24px;
                    filter: drop-shadow(0 0 10px var(--neon-glow));
                }

                .card-content h1 {
                    font-size: 20px;
                    margin: 0 0 8px;
                    letter-spacing: 2px;
                }

                .card-content p {
                    font-size: 13px;
                    opacity: 0.6;
                    margin-bottom: 32px;
                }

                .login-form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    opacity: 0.5;
                }

                .input-wrapper input {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(0, 255, 65, 0.3);
                    padding: 12px 12px 12px 40px;
                    border-radius: 4px;
                    color: var(--neon-green);
                    font-family: inherit;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }

                .input-wrapper input:focus {
                    outline: none;
                    border-color: var(--neon-green);
                    box-shadow: 0 0 10px var(--neon-glow);
                }

                .input-wrapper.error input {
                    border-color: #ef4444;
                    color: #ef4444;
                }

                .login-btn {
                    background: var(--neon-green);
                    color: black;
                    border: none;
                    padding: 14px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 1px;
                }

                .login-btn:hover {
                    box-shadow: 0 0 20px var(--neon-glow);
                    transform: translateY(-1px);
                }

                .back-link {
                    margin-top: 32px;
                    background: none;
                    border: none;
                    color: var(--neon-green);
                    font-family: inherit;
                    font-size: 11px;
                    opacity: 0.4;
                    cursor: pointer;
                }

                .back-link:hover {
                    opacity: 1;
                }

                /* Terminal Window */
                .terminal-window {
                    background: var(--card-bg);
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
                    height: 80vh;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(10px);
                }

                .window-header {
                    background: rgba(15, 15, 15, 0.95);
                    height: 44px;
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                    border-bottom: 1px solid rgba(0, 255, 65, 0.1);
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                    opacity: 0.7;
                    width: 250px;
                }

                .header-tabs {
                    flex: 1;
                    display: flex;
                    height: 100%;
                    gap: 2px;
                }

                .tab {
                    padding: 0 20px;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    font-size: 11px;
                    opacity: 0.3;
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: default;
                }

                .tab.active {
                    opacity: 1;
                    background: rgba(0, 255, 65, 0.05);
                    border-bottom: 2px solid var(--neon-green);
                }

                .header-controls {
                    display: flex;
                    gap: 8px;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(0, 255, 65, 0.2);
                }

                .window-body {
                    flex: 1;
                    padding: 24px;
                    overflow: hidden;
                    position: relative;
                }

                .content-scroll {
                    height: 100%;
                    overflow-y: auto;
                    padding-right: 10px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--neon-glow) transparent;
                }

                .content-scroll::-webkit-scrollbar {
                    width: 4px;
                }

                .content-scroll::-webkit-scrollbar-thumb {
                    background: var(--neon-glow);
                }

                .terminal-text {
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    text-shadow: 0 0 5px var(--neon-glow);
                }

                .cursor {
                    display: inline-block;
                    width: 8px;
                    height: 18px;
                    background: var(--neon-green);
                    vertical-align: middle;
                    margin-left: 4px;
                    box-shadow: 0 0 5px var(--neon-green);
                }

                .system-stats {
                    margin-top: 40px;
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .stat-card {
                    background: rgba(0, 255, 65, 0.03);
                    border: 1px solid rgba(0, 255, 65, 0.1);
                    padding: 16px;
                    border-radius: 4px;
                    flex: 1;
                    min-width: 200px;
                }

                .stat-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 12px;
                    opacity: 0.7;
                }

                .progress-bar {
                    height: 2px;
                    background: rgba(0, 255, 65, 0.1);
                    border-radius: 2px;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--neon-green);
                    box-shadow: 0 0 10px var(--neon-green);
                }

                .stat-value {
                    font-size: 16px;
                    font-weight: bold;
                }

                .terminal-footer {
                    margin-top: 40px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 0;
                    border-top: 1px dashed rgba(0, 255, 65, 0.1);
                }

                .prompt-icon {
                    animation: pulse 2s infinite;
                }

                .prompt-text {
                    font-size: 12px;
                    opacity: 0.5;
                }

                @keyframes pulse {
                    0% { transform: translateX(0); opacity: 1; }
                    50% { transform: translateX(5px); opacity: 0.5; }
                    100% { transform: translateX(0); opacity: 1; }
                }

                @media (max-width: 640px) {
                    .terminal-window {
                        height: 90vh;
                    }
                    .header-left {
                        width: auto;
                    }
                    .header-left span {
                        display: none;
                    }
                    .header-tabs {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
