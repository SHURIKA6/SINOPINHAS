import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, UserPlus, Compass } from 'lucide-react';

/**
 * HeroSection — Banner de boas-vindas para visitantes não logados
 * Apresenta a proposta de valor e botões de ação
 */
export default function HeroSection({ onCreateAccount, onExplore }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 71, 171, 0.9) 0%, rgba(77, 166, 255, 0.85) 50%, rgba(0, 198, 255, 0.9) 100%)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '20px',
                    padding: '40px 28px',
                    margin: '12px',
                    textAlign: 'center',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 71, 171, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
            >
                {/* Efeito de brilho no topo */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    borderRadius: '20px 20px 0 0',
                }} />

                {/* Ícone decorativo */}
                <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    style={{ fontSize: '48px', marginBottom: '12px' }}
                >
                    🌆
                </motion.div>

                <h1 style={{
                    margin: '0 0 8px',
                    fontSize: '24px',
                    fontWeight: 800,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    lineHeight: 1.2,
                }}>
                    Tudo sobre Sinop,{' '}
                    <span style={{
                        background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        em um lugar só
                    </span>
                </h1>

                <p style={{
                    margin: '0 0 24px',
                    fontSize: '15px',
                    opacity: 0.9,
                    lineHeight: 1.5,
                    maxWidth: '360px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}>
                    Compartilhe momentos, descubra eventos, conheça lugares e fique por dentro de tudo que acontece na cidade.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCreateAccount}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            border: 'none',
                            background: 'white',
                            color: '#0047AB',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        }}
                    >
                        <UserPlus size={18} />
                        Criar conta grátis
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setDismissed(true);
                            if (onExplore) onExplore();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            border: '2px solid rgba(255,255,255,0.5)',
                            background: 'transparent',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <Compass size={18} />
                        Explorar sem conta
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
