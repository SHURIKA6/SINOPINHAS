import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Play, Pause, Maximize2, Minus, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPhotoUrl } from '../lib/mediaUtils';

// Componente de Cartão de Vídeo Principal
export default function VideoCard({ video, onDelete, onLike, onOpenComments, canDelete, onShare, onReport }) {
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);

    // Alterna a reprodução (Play/Pause) do vídeo
    const togglePlay = async (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current && !videoError) {
            try {
                if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                } else {
                    await videoRef.current.play();
                    setIsPlaying(true);
                }
            } catch (err) {
                console.error("Playback error:", err);
                setIsPlaying(false);
            }
        }
    };

    // Lida com erros de carregamento do vídeo
    const handleVideoError = () => {
        console.error("Video failed to load:", video.video_url);
        setVideoError(true);
        setIsPlaying(false);
    };

    // Atualiza o tempo de reprodução e a barra de progresso
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setDuration(total || 0);
            setProgress(total ? (current / total) * 100 : 0);
        }
    };

    // Gerencia a navegação (seek) na barra de tempo
    const handleSeek = (e) => {
        e.stopPropagation();
        const value = Number(e.target.value);
        const newTime = (value / 100) * duration;
        if (videoRef.current && isFinite(newTime)) {
            try {
                videoRef.current.currentTime = newTime;
                setProgress(value);
            } catch (err) {
                console.error("Seek error", err);
            }
        }
    };

    // Formata segundos para o formato MM:SS
    const formatTime = (time) => {
        if (!time || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Abre os comentários ao clicar no vídeo
    const handleContainerClick = () => {
        onOpenComments(video);
    };

    const formattedDate = new Date(video.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const isPhoto = video.type === 'photo' || isPhotoUrl(video.video_url);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="wmp-container"
            style={{ marginBottom: 24 }}
        >
            {/* Barra de Título estilo Sinopinhas Media Player */}
            <div className="wmp-title-bar">
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                    {isPhoto ? 'Sinopinhas Picture Viewer' : 'Sinopinhas Media Player'} - {video.username}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <Minus size={10} />
                    <Maximize2 size={10} />
                    <X size={10} />
                </div>
            </div>

            {/* Tela do Vídeo / Conteúdo Principal */}
            <div className="wmp-video-screen"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleContainerClick}
            >
                {videoError && !isPhoto ? (
                    <div style={{ width: '100%', height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', background: '#1a1a1a' }}>
                        <X size={48} color="#D44033" />
                        <p style={{ marginTop: 12, fontSize: 12 }}>Playback Error</p>
                    </div>
                ) : isPhoto ? (
                    <img
                        src={video.video_url}
                        alt={video.description}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px', display: 'block' }}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }}
                        loop
                        muted={false}
                        playsInline
                        poster={video.thumbnail_url}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleTimeUpdate}
                        onError={handleVideoError}
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    />
                )}

                {!isPlaying && !videoError && !isPhoto && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                            <Play size={30} fill="white" stroke="white" style={{ marginLeft: 4 }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Controles de Mídia (Apenas para Vídeos) */}
            {!isPhoto && (
                <div className="wmp-controls">
                    <button className="wmp-btn" onClick={togglePlay} disabled={videoError}
                        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}>
                        {isPlaying ? <Pause size={14} fill="#333" /> : <Play size={14} fill="#333" style={{ marginLeft: 2 }} />}
                    </button>

                    {/* Barra de Progresso */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            disabled={videoError}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                height: '4px',
                                appearance: 'none',
                                background: '#888',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                outline: 'none',
                                opacity: videoError ? 0.5 : 1
                            }}
                            className="wmp-slider"
                        />
                    </div>

                    <div style={{ fontSize: 10, color: '#333', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' }}>
                        {formatTime(currentTime)}
                    </div>
                </div>
            )}

            {/* Metadados e Ações do Vídeo */}
            <div style={{ background: '#F0F0F0', padding: 12, borderTop: '1px solid #CCC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <img
                        src={video.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                        onClick={(e) => { e.stopPropagation(); window.openPublicProfile && window.openPublicProfile(video.user_id); }}
                        style={{ width: '32px', height: '32px', borderRadius: 4, border: '1px solid #999', cursor: 'pointer' }}
                        alt={video.username}
                    />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>{video.title || 'Untitled Video'}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>
                            <span
                                onClick={(e) => { e.stopPropagation(); window.openPublicProfile && window.openPublicProfile(video.user_id); }}
                                style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0044CC' }}
                            >
                                {video.username}
                            </span> • {formattedDate}
                        </div>
                    </div>
                </div>

                <p style={{ fontSize: '12px', color: '#444', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    {video.description || "No description provided."}
                </p>

                <div className="xp-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className={`xp-action-btn ${video.user_liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                        aria-label={`Curtir (${video.likes || 0} curtidas)`}
                    >
                        <Heart size={14} fill={video.user_liked ? "red" : "none"} />
                        <span>{video.likes || 0}</span>
                    </button>

                    <button className="xp-action-btn" onClick={(e) => { e.stopPropagation(); onOpenComments(video); }}
                        aria-label="Abrir comentários">
                        <MessageCircle size={14} />
                        <span>Comment</span>
                    </button>

                    <button className="xp-action-btn" onClick={(e) => { e.stopPropagation(); onShare(video); }}
                        aria-label="Compartilhar vídeo">
                        <Share2 size={14} />
                        <span>Share</span>
                    </button>

                    {canDelete && (
                        <button className="xp-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}
                            aria-label="Excluir vídeo">
                            <Trash2 size={14} />
                        </button>
                    )}

                    {onReport && (
                        <button className="xp-action-btn" onClick={(e) => { e.stopPropagation(); onReport(video.id, 'video'); }}
                            aria-label="Denunciar conteúdo" title="Denunciar">
                            <Flag size={14} />
                        </button>
                    )}
                </div>
            </div>
            <style jsx>{`
                .wmp-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #00FF00; /* WMP Green */
                    border: 1px solid white;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
                .wmp-slider::-moz-range-thumb {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #00FF00;
                    border: 1px solid white;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.3);
                }
            `}</style>
        </motion.div>
    );
}
