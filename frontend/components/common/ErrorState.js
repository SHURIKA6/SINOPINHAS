import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorState — Componente reutilizável para estados de erro com retry
 * Props: message, onRetry, compact
 */
export default function ErrorState({ message = 'Algo deu errado', onRetry, compact = false }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: compact ? '24px 16px' : '48px 24px',
                textAlign: 'center',
                minHeight: compact ? '120px' : '200px',
            }}
        >
            <div style={{
                background: 'rgba(255, 59, 48, 0.1)',
                borderRadius: '50%',
                padding: compact ? '12px' : '16px',
                marginBottom: '12px',
            }}>
                <AlertTriangle
                    size={compact ? 28 : 40}
                    color="#FF3B30"
                    strokeWidth={2}
                />
            </div>
            <h3 style={{
                margin: '0 0 6px',
                fontSize: compact ? '15px' : '18px',
                fontWeight: 700,
                color: '#1a1a2e',
            }}>
                Ops!
            </h3>
            <p style={{
                margin: '0 0 16px',
                fontSize: compact ? '13px' : '14px',
                color: '#666',
                maxWidth: '280px',
                lineHeight: 1.5,
            }}>
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        border: '1px solid rgba(0, 71, 171, 0.3)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        color: '#0047AB',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.target.style.background = '#0047AB';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                        e.target.style.color = '#0047AB';
                    }}
                >
                    <RefreshCw size={14} />
                    Tentar de novo
                </button>
            )}
        </motion.div>
    );
}
