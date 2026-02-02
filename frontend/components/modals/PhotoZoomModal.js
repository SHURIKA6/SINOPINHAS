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
                        <span>{title || 'Visualizador de Imagens'} - Windows Picture Viewer</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={onClose} style={{ background: '#D44033', border: '1px solid white', color: 'white', width: 20, height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Barra de Ferramentas */}
                    <div className="fax-toolbar">
                        <button className="fax-btn" onClick={() => setIsInternalZoom(!isInternalZoom)}>
                            <ZoomIn size={20} color="#333" />
                        </button>
                        <button className="fax-btn" onClick={handleDownload}>
                            <Download size={20} color="#333" />
                        </button>
                        <button className="fax-btn">
                            <span style={{ fontSize: 18 }}>🖨️</span>
                        </button>
                        <button className="fax-btn">
                            <span style={{ fontSize: 18 }}>💾</span>
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
                                transition: 'transform 0.3s ease'
                            }}
                            onClick={() => setIsInternalZoom(!isInternalZoom)}
                        />
                    </div>

                    <div style={{ background: '#ECE9D8', padding: '4px 12px', fontSize: 11, color: '#666', borderTop: '1px solid #CCC' }}>
                        Visualizando imagem • {title || 'Sem título'}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PhotoZoomModal;
