import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Play, Pause, Maximize2 } from 'lucide-react';
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
            className="xp-window"
        >
            {/* XP Title Bar */}
            <div className="xp-title-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={video.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                        style={{ width: '16px', height: '16px', borderRadius: '2px', border: '1px solid white' }} />
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                        {video.title || 'Windows Media Player'} - {video.username}
                    </span>
                </div>
                <div className="xp-controls">
                    <button className="xp-control-btn">_</button>
                    <button className="xp-control-btn">□</button>
                    <button className="xp-control-btn close">X</button>
                </div>
            </div>

            {/* XP Content Body */}
            <div className="xp-content-body">
                <div
                    className="video-box"
                    style={{
                        background: 'black', border: '2px solid #999', borderRadius: '2px',
                        position: 'relative', aspectRatio: '9/16', overflow: 'hidden',
                        cursor: 'pointer', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleContainerClick}
                >
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        loop
                        muted
                        playsInline
                        poster={video.thumbnail_url}
                    />

                    {!isPlaying && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                            <Play size={48} fill="white" stroke="white" />
                        </div>
                    )}

                    <button
                        onClick={togglePlay}
                        style={{
                            position: 'absolute', bottom: '10px', right: '10px',
                            background: 'rgba(0,0,0,0.5)', border: '1px solid white', color: 'white',
                            borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>

                <div style={{ marginTop: '12px', color: 'black' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Post ID: #{video.id}</span>
                        <span>{formattedDate}</span>
                    </div>

                    <p style={{ fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                        {video.description || "No description provided."}
                    </p>

                    <div className="xp-actions-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            className={`xp-action-btn ${video.user_liked ? 'liked' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                        >
                            <Heart size={14} fill={video.user_liked ? "red" : "none"} />
                            <span>{video.likes || 0} Like(s)</span>
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
            </div>
        </motion.div>
    );
}
