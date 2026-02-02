import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoCard({ video, onDelete, onLike, onOpenComments, canDelete, onShare }) {
    const [isHovering, setIsHovering] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
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
                    <Minimize2 size={10} />
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
                    muted
                    playsInline
                    poster={video.thumbnail_url}
                />

                {!isPlaying && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div style={{ flex: 1, height: 4, background: '#888', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: '40%', height: '100%', background: '#00FF00' }}></div>
                </div>
                <div style={{ fontSize: 10, color: '#333', fontWeight: 'bold' }}>00:00</div>
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
        </motion.div>
    );
}
