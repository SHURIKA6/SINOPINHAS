import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Download } from 'lucide-react';

const PhotoZoomModal = ({ isOpen, photoUrl, title, onClose }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = `sinopinhas-${title || 'photo'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [isInternalZoom, setIsInternalZoom] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="fax-viewer-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Barra de Título Visualizador de Fax */}
                    <div className="fax-title-bar">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🖼️</span>
                            {title || 'Visualizador de Imagens'}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button
                                onClick={onClose}
                                className="fax-btn"
                                style={{
                                    width: 28,
                                    height: 28,
                                    padding: 0,
                                    background: 'rgba(255, 60, 60, 0.8)',
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)'
                                }}
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Ferramentas */}
                    <div className="fax-toolbar">
                        <button className="fax-btn" onClick={() => setIsInternalZoom(!isInternalZoom)} title="Zoom">
                            <ZoomIn size={20} />
                        </button>
                        <button className="fax-btn" onClick={handleDownload} title="Salvar">
                            <Download size={20} />
                        </button>
                    </div>

                    {/* Área de Conteúdo */}
                    <div className="fax-content">
                        <img
                            src={photoUrl}
                            alt={title}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                cursor: isInternalZoom ? 'zoom-out' : 'zoom-in',
                                transform: isInternalZoom ? 'scale(1.5)' : 'scale(1)',
                                transition: 'transform 0.3s ease',
                                borderRadius: 4,
                                boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                            }}
                            onClick={() => setIsInternalZoom(!isInternalZoom)}
                        />
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        fontSize: 12,
                        color: '#003366',
                        borderTop: '1px solid rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Visualizando imagem • {title || 'Sem título'}</span>
                        <span style={{ opacity: 0.7 }}>Sinopinhas Viewer</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PhotoZoomModal;
