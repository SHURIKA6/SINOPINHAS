import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, Ban, MessageCircleOff, HelpCircle } from 'lucide-react';

const REASONS = [
    { value: 'offensive', label: 'Conteúdo ofensivo', icon: <AlertTriangle size={16} /> },
    { value: 'spam', label: 'Spam / Publicidade', icon: <Ban size={16} /> },
    { value: 'false_info', label: 'Informação falsa', icon: <MessageCircleOff size={16} /> },
    { value: 'other', label: 'Outro motivo', icon: <HelpCircle size={16} /> },
];

/**
 * ReportModal — Modal para denunciar conteúdo
 * Props: isOpen, onClose, onSubmit, contentType, contentId
 */
export default function ReportModal({ isOpen, onClose, onSubmit, contentType, contentId }) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason) return;
        setLoading(true);
        try {
            await onSubmit({ content_type: contentType, content_id: contentId, reason, details });
            onClose();
            setReason('');
            setDetails('');
        } catch (err) {
            console.error('Erro ao denunciar:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '400px',
                        overflow: 'hidden',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.5)',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        background: 'linear-gradient(180deg, rgba(255,59,48,0.05) 0%, transparent 100%)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Flag size={18} color="#FF3B30" />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
                                Denunciar
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                borderRadius: '50%', display: 'flex',
                            }}
                        >
                            <X size={18} color="#999" />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px 20px' }}>
                        <p style={{
                            margin: '0 0 16px',
                            fontSize: '13px',
                            color: '#666',
                            lineHeight: 1.5,
                        }}>
                            Selecione o motivo da denúncia. Nossa equipe irá analisar o conteúdo.
                        </p>

                        {/* Opções de motivo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {REASONS.map(r => (
                                <label
                                    key={r.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        border: `2px solid ${reason === r.value ? '#4DA6FF' : 'rgba(0,0,0,0.08)'}`,
                                        background: reason === r.value ? 'rgba(77, 166, 255, 0.06)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={e => setReason(e.target.value)}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ color: reason === r.value ? '#4DA6FF' : '#999' }}>
                                        {r.icon}
                                    </div>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: reason === r.value ? 600 : 400,
                                        color: reason === r.value ? '#1a1a2e' : '#555',
                                    }}>
                                        {r.label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* Detalhes opcionais */}
                        <textarea
                            placeholder="Detalhes adicionais (opcional)"
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            maxLength={500}
                            style={{
                                width: '100%',
                                minHeight: '70px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'rgba(0,0,0,0.02)',
                                fontSize: '13px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        padding: '12px 20px',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        background: 'rgba(0,0,0,0.02)',
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'white',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: 500,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!reason || loading}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '10px',
                                border: 'none',
                                background: reason ? '#FF3B30' : '#ccc',
                                color: 'white',
                                fontSize: '13px',
                                cursor: reason ? 'pointer' : 'not-allowed',
                                fontWeight: 600,
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? 'Enviando...' : 'Enviar Denúncia'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
