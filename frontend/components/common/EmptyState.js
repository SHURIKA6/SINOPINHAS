import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EmptyState — Componente reutilizável para telas/seções vazias
 * Props: icon (emoji/string), title, description, actionLabel, onAction
 */
export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                textAlign: 'center',
                minHeight: '200px',
            }}
        >
            <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}>
                {icon}
            </div>
            <h3 style={{
                margin: '0 0 8px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1a1a2e',
            }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    margin: '0 0 20px',
                    fontSize: '14px',
                    color: '#666',
                    maxWidth: '300px',
                    lineHeight: 1.5,
                }}>
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '20px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #4DA6FF, #00C6FF)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 198, 255, 0.3)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 198, 255, 0.5)';
                    }}
                    onMouseLeave={e => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 198, 255, 0.3)';
                    }}
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
}
