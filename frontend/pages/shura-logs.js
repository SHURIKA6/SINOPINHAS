import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Lock, Shield, Eye, Cpu } from 'lucide-react';
import { useRouter } from 'next/router';

export default function ShuraLogs() {
    const [text, setText] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const router = useRouter();

    // Mensagem secreta que o usuário pode editar depois
    const secretContent = `
> [SISTEMA_INICIALIZADO]
> ACESSO_AUTORIZADO: NIVEL_SHURA
> DATA: ${new Date().toLocaleDateString()}

Olá, explorador. Se você chegou aqui através dos comentários no console, você tem o olhar apurado.

Aqui é onde guardamos as notas de desenvolvimento e segredos que a maioria nunca verá.

-- NOTAS DE SISTEMA --
1. A API de Push foi corrigida para usar Endpoints únicos.
2. O banco Neon está operando em modo Serverless.
3. O design está sendo refinado para máxima estética.

Sabe, estou fazendo esse site para encher minha mente com algo.
Ultimamente, não tenho muito que fazer, e pensamentos pesados vieram a minha cabeça. 
É melhor perder tempo com um site aleatório do que perder o resto de uma vida, né?
Sei lá se alguém vai achar isso, mas se você está aqui, talvez você é curioso pra krl.


-- FIM DA TRANSMISSÃO --
    `;

    useEffect(() => {
        let i = 0;
        if (isAuthenticated) {
            const interval = setInterval(() => {
                setText(secretContent.slice(0, i));
                i++;
                if (i > secretContent.length) clearInterval(interval);
            }, 30);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        // Um pequeno desafio de "senha" que pode ser encontrado no console ou predefinido
        if (password.toLowerCase() === 'shura' || password.toLowerCase() === 'sinopinhas') {
            setIsAuthenticated(true);
        } else {
            alert('Acesso negado. A senha está no código? Talvez seja o nome do app...');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-[#00ff41] p-4 md:p-12 font-mono selection:bg-[#00ff41] selection:text-black">
            <Head>
                <title>SECURE_SHELL // SHURA</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto"
            >
                {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="mb-8 opacity-50"
                        >
                            <Shield size={64} />
                        </motion.div>

                        <h1 className="text-2xl font-bold mb-4 tracking-tighter">SISTEMA DE ARQUIVOS PROTEGIDO</h1>
                        <p className="text-sm opacity-60 mb-8 max-w-sm">
                            Esta área contém logs confidenciais. Acesso restrito a desenvolvedores autorizados.
                        </p>

                        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                                <input
                                    type="password"
                                    placeholder="DIGITE_CREDENCIAIS"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-[#00ff41]/30 rounded p-3 pl-10 focus:outline-none focus:border-[#00ff41] transition-all text-[#00ff41]"
                                />
                            </div>
                            <button className="bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] py-2 rounded hover:bg-[#00ff41] hover:text-black transition-all font-bold">
                                DESCRIPTOGRAFAR
                            </button>
                        </form>

                        <button
                            onClick={() => router.push('/')}
                            className="mt-12 text-xs opacity-40 hover:opacity-100 transition-all cursor-pointer"
                        >
                            -- VOLTAR PARA A SUPERFÍCIE --
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[#00ff41]/20 pb-4 mb-8">
                            <div className="flex items-center gap-3">
                                <Terminal size={20} />
                                <span className="text-sm font-bold">TERMINAL: shura@sinopinhas_os:~/hidden_logs</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                            </div>
                        </div>

                        <div className="terminal-content whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                            {text}
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-2 h-5 bg-[#00ff41] ml-1 align-middle"
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 3 }}
                            className="pt-12 flex gap-6"
                        >
                            <div className="bg-[#00ff41]/5 p-4 rounded border border-[#00ff41]/10 flex-1">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold opacity-70">
                                    <Cpu size={14} />
                                    <span>STATUS_DA_CPU</span>
                                </div>
                                <div className="h-1 bg-[#00ff41]/20 rounded overflow-hidden">
                                    <motion.div
                                        animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                        className="h-full bg-[#00ff41]"
                                    />
                                </div>
                            </div>
                            <div className="bg-[#00ff41]/5 p-4 rounded border border-[#00ff41]/10 flex-1">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold opacity-70">
                                    <Eye size={14} />
                                    <span>LOG_DE_VISUALIZAÇÃO</span>
                                </div>
                                <span className="text-[10px]">VISITANTE_ID: XXX-XXXX-XXX</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>

            <style jsx global>{`
                body {
                    background-color: #0a0a0c !important;
                }
                .terminal-content {
                    text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);
                }
            `}</style>
        </div>
    );
}
