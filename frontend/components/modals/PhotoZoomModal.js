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
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    padding: isInternalZoom ? '0' : '24px',
                    cursor: isInternalZoom ? 'zoom-out' : 'default'
                }}
                onClick={isInternalZoom ? () => setIsInternalZoom(false) : onClose}
            >
                {/* Header Controls */}
                {!isInternalZoom && (
                    <div style={{
                        position: 'absolute',
                        top: 'max(20px, env(safe-area-inset-top))',
                        right: 20,
                        display: 'flex',
                        gap: 16,
                        zIndex: 10001
                    }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={24} />
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: isInternalZoom ? 'auto' : 'hidden'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={photoUrl}
                        alt={title}
                        onClick={() => setIsInternalZoom(!isInternalZoom)}
                        style={{
                            maxWidth: isInternalZoom ? 'none' : '100%',
                            maxHeight: isInternalZoom ? 'none' : '100%',
                            objectFit: 'contain',
                            borderRadius: isInternalZoom ? 0 : 12,
                            boxShadow: isInternalZoom ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            cursor: isInternalZoom ? 'zoom-out' : 'zoom-in',
                            transition: 'all 0.3s ease'
                        }}
                    />
                </motion.div>

                {/* Caption / Title */}
                {title && !isInternalZoom && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{
                            position: 'absolute',
                            bottom: 'max(40px, env(safe-area-inset-bottom))',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '12px 24px',
                            borderRadius: '20px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            maxWidth: '90%',
                            textAlign: 'center'
                        }}
                    >
                        {title}
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default PhotoZoomModal;
