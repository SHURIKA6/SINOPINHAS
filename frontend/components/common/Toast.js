import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 10001,
                background: type === 'success' ? '#10b981' : '#ef4444',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: '280px',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: 6 }}>
                {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>

            <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>
                    {type === 'success' ? 'Sucesso' : 'Erro'}
                </span>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>{message}</span>
            </div>

            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    opacity: 0.6,
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex'
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
