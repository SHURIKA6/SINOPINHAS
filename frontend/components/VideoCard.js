import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Play, Pause, Maximize2, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoCard({ video, onDelete, onLike, onOpenComments, canDelete, onShare }) {
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef(null);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setDuration(total);
            setProgress((current / total) * 100);
        }
    };

    const handleSeek = (e) => {
        e.stopPropagation(); // Stop click from bubbling to other elements
        const newTime = (e.target.value / 100) * duration;
        videoRef.current.currentTime = newTime;
        setProgress(e.target.value);
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleContainerClick = () => {
        onOpenComments(video);
    };

    const formattedDate = new Date(video.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="wmp-container"
            style={{ marginBottom: 24 }}
        >
            {/* WMP Title Bar */}
            <div className="wmp-title-bar">
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                    Windows Media Player - {video.username}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <Minus size={10} />
                    <Maximize2 size={10} />
                    <X size={10} />
                </div>
            </div>

            {/* Content Body */}
            <div className="wmp-video-screen"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleContainerClick}
            >
                <video
                    ref={videoRef}
                    src={video.video_url}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }}
                    loop
                    muted={false} // Allow sound for functional player
                    playsInline
                    poster={video.thumbnail_url}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleTimeUpdate}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }} // Click video to toggle play
                />

                {!isPlaying && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                            <Play size={30} fill="white" stroke="white" style={{ marginLeft: 4 }} />
                        </div>
                    </div>
                )}
            </div>

            {/* WMP Controls */}
            <div className="wmp-controls">
                <button className="wmp-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={14} fill="#333" /> : <Play size={14} fill="#333" style={{ marginLeft: 2 }} />}
                </button>

                {/* Seek Bar */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            height: '4px',
                            appearance: 'none',
                            background: '#888',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                        className="wmp-slider"
                    />
                </div>

                <div style={{ fontSize: 10, color: '#333', fontWeight: 'bold', minWidth: '35px', textAlign: 'right' }}>
                    {formatTime(currentTime)}
                </div>
            </div>

            {/* Metadata & Actions (Styled as Playlist/Media Info) */}
            <div style={{ background: '#F0F0F0', padding: 12, borderTop: '1px solid #CCC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <img src={video.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                        style={{ width: '32px', height: '32px', borderRadius: 4, border: '1px solid #999' }} />
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>{video.title || 'Untitled Video'}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{video.username} • {formattedDate}</div>
                    </div>
                </div>

                <p style={{ fontSize: '12px', color: '#444', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    {video.description || "No description provided."}
                </p>

                <div className="xp-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        className={`xp-action-btn ${video.user_liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                    >
                        <Heart size={14} fill={video.user_liked ? "red" : "none"} />
                        <span>{video.likes || 0}</span>
                    </button>

                    <button className="xp-action-btn" onClick={(e) => { e.stopPropagation(); onOpenComments(video); }}>
                        <MessageCircle size={14} />
                        <span>Comment</span>
                    </button>

                    <button className="xp-action-btn" onClick={(e) => { e.stopPropagation(); onShare(video); }}>
                        <Share2 size={14} />
                        <span>Share</span>
                    </button>

                    {canDelete && (
                        <button className="xp-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}>
                            <Trash2 size={14} />
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
