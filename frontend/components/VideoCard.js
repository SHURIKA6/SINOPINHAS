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
            className="glass-panel" // New Glass Class
        >
            <div className="card-media-wrapper">
                <div
                    className="media-frame"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleContainerClick}
                >
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        className="media-element"
                        loop
                        muted
                        playsInline
                        poster={video.thumbnail_url}
                    />

                    {!isPlaying && (
                        <div className="play-overlay">
                            <Play size={48} fill="white" className="play-icon-center" />
                        </div>
                    )}

                    <button className="play-toggle-btn" onClick={togglePlay}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>
            </div>

            <div className="card-details">
                <div className="card-header">
                    <img src={video.avatar || 'https://www.gravatar.com/avatar?d=mp'} className="card-avatar" />
                    <div className="card-user-info">
                        <strong>{video.title || 'Sem título'}</strong>
                        <span>{video.username}</span>
                    </div>
                </div>

                <div className="card-actions-row">
                    <button
                        className={`glass-action-btn ${video.user_liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                    >
                        <Heart size={16} fill={video.user_liked ? "#FF4081" : "none"} />
                        <span>{video.likes || 0}</span>
                    </button>

                    <button className="glass-action-btn" onClick={(e) => { e.stopPropagation(); onOpenComments(video); }}>
                        <MessageCircle size={16} />
                    </button>

                    <button className="glass-action-btn" onClick={(e) => { e.stopPropagation(); onShare(video); }}>
                        <Share2 size={16} />
                    </button>

                    {canDelete && (
                        <button className="glass-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .card-media-wrapper {
                    position: relative; border-radius: 12px; overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                }

                .media-frame {
                    aspect-ratio: 9/16; background: black; position: relative;
                    display: flex; justify-content: center; cursor: pointer;
                }
                .media-element { width: 100%; height: 100%; object-fit: contain; }

                .play-overlay {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center;
                }
                .play-toggle-btn {
                    position: absolute; bottom: 10px; right: 10px;
                    width: 32px; height: 32px; border-radius: 50%;
                    background: rgba(255,255,255,0.2); border: 1px solid white;
                    color: white; display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(4px); cursor: pointer;
                }

                .card-details {
                    margin-top: 12px; color: white;
                }

                .card-header {
                    display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
                }
                .card-avatar { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); }
                .card-user-info { display: flex; flex-direction: column; font-size: 13px; line-height: 1.2; }
                .card-user-info strong { font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
                .card-user-info span { opacity: 0.8; font-size: 11px; }

                .card-actions-row {
                    display: flex; gap: 8px;
                }

                .glass-action-btn {
                    flex: 1; height: 32px; border-radius: 16px;
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                    color: white; display: flex; align-items: center; justify-content: center; gap: 6px;
                    cursor: pointer; transition: all 0.2s; font-size: 12px; font-weight: bold;
                }
                .glass-action-btn:hover { background: rgba(255,255,255,0.25); box-shadow: 0 0 10px rgba(255,255,255,0.2); }
                .glass-action-btn.liked { color: #FF4081; background: rgba(255, 64, 129, 0.15); border-color: rgba(255, 64, 129, 0.4); }
                .glass-action-btn.delete { color: #FF5252; flex: 0 0 32px; }

            `}</style>
        </motion.div>
    );
}
