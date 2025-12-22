import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Lock, Shield, Eye, Cpu, AlertTriangle, ChevronRight, Binary, Send } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { discoverLogs, submitShuraMessage, fetchApprovedShuraMessages, fetchSystemLogs } from '../services/api';

export default function ShuraLogs() {
    const [text, setText] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const [activeTab, setActiveWindowTab] = useState('log');
    const [communityMessages, setCommunityMessages] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [displayText, setDisplayText] = useState('');

    // Gera o conteúdo do log dinamicamente com base nas mensagens e nos logs do sistema
    const getDynamicContent = (messages, logs) => {
        let content = `> [SISTEMA_INICIALIZADO_V4.0]\n> DATA: ${new Date().toLocaleDateString()}\n> STATUS: ONLINE\n> KERNEL: SHURA_PROTO_V3\n\n`;

        // Combinar e ordenar por data
        const allItems = [
            ...messages.map(m => ({ ...m, type: 'COMMUNITY' })),
            ...logs.map(l => ({ ...l, type: 'SYSTEM' }))
        ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        if (allItems.length === 0) {
            content += "Nenhum arquivo de log detectado no momento. Aguardando transmissões...\n\n";
        } else {
            content += "-- ARQUIVOS DE LOG RECURUPERADOS --\n\n";
            allItems.forEach((item, idx) => {
                const dateStr = new Date(item.created_at).toLocaleString('pt-BR');
                if (item.type === 'COMMUNITY') {
                    content += `[LOG_${(idx + 1).toString().padStart(3, '0')}] // TRANSMISSÃO_USER\n`;
                    content += `> ORIGEM: ${item.username.toUpperCase()}\n`;
                    content += `> MENSAGEM: ${item.message}\n`;
                    content += `> TIMESTAMP: ${dateStr}\n\n`;
                } else {
                    content += `[LOG_${(idx + 1).toString().padStart(3, '0')}] // EVENTO_SISTEMA\n`;
                    content += `> AÇÃO: ${item.action}\n`;
                    content += `> SUJEITO: ${item.username || 'ANONYMOUS'}\n`;
                    if (item.city) content += `> LOCAL: ${item.city}, ${item.country}\n`;
                    if (item.os) content += `> DEVICE: ${item.os} (${item.browser})\n`;
                    content += `> TIMESTAMP: ${dateStr}\n\n`;
                }
            });
        }

        content += "-- FIM DA TRANSMISSÃO --";
        return content;
    };

    useEffect(() => {
        if (isAuthenticated && (communityMessages.length >= 0 || systemLogs.length >= 0)) {
            const secretContent = getDynamicContent(communityMessages, systemLogs);
            let i = 0;
            const interval = setInterval(() => {
                setDisplayText(secretContent.slice(0, i));
                i++;
                if (i > secretContent.length) clearInterval(interval);
            }, 10); // Velocidade ajustada para o volume de dados
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, communityMessages, systemLogs]);

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

    useEffect(() => {
        if (isAuthenticated) {
            loadAllLogs();
        }
    }, [isAuthenticated]);

    const loadAllLogs = async () => {
        try {
            const [msgRes, sysRes] = await Promise.all([
                fetchApprovedShuraMessages(),
                fetchSystemLogs()
            ]);
            setCommunityMessages(msgRes.data || []);
            setSystemLogs(sysRes.data || []);
        } catch (err) {
            console.error("Erro ao carregar arquivos:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;

        try {
            setIsSubmitting(true);
            await submitShuraMessage(userMessage);
            setUserMessage('');
            alert("Mensagem enviada! Ela aparecerá aqui após ser aprovada por um administrador.");
        } catch (err) {
            console.error(err);
            alert("Erro ao enviar mensagem.");
        } finally {
            setIsSubmitting(false);
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
                                    <div
                                        className={`tab ${activeTab === 'log' ? 'active' : ''}`}
                                        onClick={() => setActiveWindowTab('log')}
                                    >
                                        secret_notes.log
                                    </div>
                                    <div
                                        className={`tab ${activeTab === 'community' ? 'active' : ''}`}
                                        onClick={() => setActiveWindowTab('community')}
                                    >
                                        community_logs.txt
                                    </div>
                                    <div
                                        className={`tab ${activeTab === 'visual' ? 'active' : ''}`}
                                        onClick={() => setActiveWindowTab('visual')}
                                    >
                                        visual_archive.jpeg
                                    </div>
                                </div>
                                <div className="header-controls">
                                    <div className="dot" />
                                    <div className="dot" />
                                    <div className="dot" />
                                </div>
                            </div>

                            <div className="window-body">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'log' ? (
                                        <motion.div
                                            key="log-content"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="content-scroll"
                                        >
                                            <div className="terminal-text">
                                                {displayText}
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

                                            {/* Dynamic content replaced static notes, footer section removed redundant community list */}
                                        </motion.div>
                                    ) : activeTab === 'community' ? (
                                        <motion.div
                                            key="community-input"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="community-form-container"
                                        >
                                            <div className="form-header">
                                                <h3>CONTRIBUIÇÃO AO LOG</h3>
                                                <p>Sua mensagem será revisada e poderá ser exibida permanentemente no log secreto.</p>
                                            </div>
                                            <form onSubmit={handleSendMessage} className="shura-form">
                                                <textarea
                                                    value={userMessage}
                                                    onChange={(e) => setUserMessage(e.target.value)}
                                                    placeholder="Digite sua reflexão, código ou mensagem para o log..."
                                                    maxLength={500}
                                                />
                                                <button type="submit" disabled={isSubmitting || !userMessage.trim()}>
                                                    {isSubmitting ? 'TRANSMITINDO...' : (
                                                        <>
                                                            <Send size={16} />
                                                            ENVIAR MENSAGEM
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="visual-content"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.05 }}
                                            className="visual-archive"
                                        >
                                            <div className="archive-frame">
                                                <div className="glitch-overlay" />
                                                <img
                                                    src="/shura-visual.jpg"
                                                    alt="ARCHIVE_01"
                                                    className="archive-img"
                                                />
                                                <div className="img-metadata">
                                                    <div className="meta-tag">ENCRYPTED_MEDIA</div>
                                                    <div className="meta-tag">SOURCE: UNKNOWN</div>
                                                    <div className="meta-tag">LOC: SINOP_SURREAL</div>
                                                </div>
                                            </div>
                                            <div className="warning-box">
                                                <AlertTriangle size={18} />
                                                <span>Aviso: Arquivo visual detectado com resquícios de psicodelia urbana.</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab:hover {
                    opacity: 0.6;
                    background: rgba(255, 255, 255, 0.02);
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

                /* Visual Archive */
                .visual-archive {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .archive-frame {
                    position: relative;
                    flex: 1;
                    min-height: 300px;
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    border-radius: 4px;
                    overflow: hidden;
                    background: black;
                }

                .archive-img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: contrast(1.1) brightness(0.9) hue-rotate(-5deg);
                }

                .glitch-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(0deg, rgba(0, 255, 65, 0.05) 0%, transparent 100%);
                    z-index: 5;
                    pointer-events: none;
                }

                .img-metadata {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 12px;
                    display: flex;
                    gap: 16px;
                    border-top: 1px solid rgba(0, 255, 65, 0.2);
                }

                .meta-tag {
                    font-size: 10px;
                    background: rgba(0, 255, 65, 0.1);
                    padding: 4px 8px;
                    border: 1px solid rgba(0, 255, 65, 0.2);
                    border-radius: 2px;
                }

                .warning-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 4px;
                    color: #ef4444;
                    font-size: 12px;
                }

                /* Community Section in Log */
                .community-section {
                    margin-top: 40px;
                    border-top: 1px dashed rgba(0, 255, 65, 0.2);
                    padding-top: 24px;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    color: var(--accent-color);
                    margin-bottom: 16px;
                    opacity: 0.8;
                }

                .messages-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .comm-msg {
                    font-size: 13px;
                    line-height: 1.4;
                }

                .comm-user {
                    color: #fff;
                    font-weight: bold;
                }

                .comm-sep {
                    color: var(--accent-color);
                    margin: 0 8px;
                }

                .comm-text {
                    color: rgba(0, 255, 65, 0.8);
                }

                /* Community Form */
                .community-form-container {
                    padding: 20px;
                }

                .form-header h3 {
                    font-size: 18px;
                    margin: 0 0 8px;
                    color: var(--accent-color);
                }

                .form-header p {
                    font-size: 13px;
                    color: var(--secondary-text);
                    margin-bottom: 24px;
                }

                .shura-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .shura-form textarea {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(0, 255, 65, 0.3);
                    border-radius: 8px;
                    padding: 16px;
                    color: var(--accent-color);
                    font-family: 'JetBrains Mono', monospace;
                    min-height: 150px;
                    outline: none;
                    transition: all 0.2s;
                    resize: none;
                }

                .shura-form textarea:focus {
                    border-color: var(--accent-color);
                    box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
                }

                .shura-form button {
                    align-self: flex-end;
                    background: var(--accent-color);
                    color: black;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .shura-form button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 255, 65, 0.4);
                }

                .shura-form button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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
