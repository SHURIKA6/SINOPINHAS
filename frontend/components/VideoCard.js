import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Play, Pause, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentsSection from './CommentsSection';

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
            className="xp-window" // Global XP Window Class
        >
            {/* XP Title Bar */}
            <div className="xp-title-bar">
                <div className="window-title">
                    <img src={video.avatar || 'https://www.gravatar.com/avatar?d=mp'} className="title-icon" />
                    <span>{video.title || 'Sem título'} - {video.username}</span>
                </div>
                <div className="window-controls">
                    <button className="win-btn min">_</button>
                    <button className="win-btn max">□</button>
                    <button className="win-btn close">X</button>
                </div>
            </div>

            {/* Window Content (The Video) */}
            <div className="xp-content video-window-body">
                <div
                    className="video-frame"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleContainerClick}
                >
                    <video
                        ref={videoRef}
                        src={video.video_url}
                        className="post-video"
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

                    <button
                        className="play-toggle-btn"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>

                <div className="post-meta">
                    <div className="post-info">
                        <span className="post-id">#{video.id}</span>
                        <span className="post-date">Enviado em: {formattedDate}</span>
                    </div>

                    <div className="post-description">
                        {video.description || "Sem descrição."}
                    </div>

                    <div className="post-actions-bar">
                        <button
                            className={`xp-button action-btn ${video.user_liked ? 'liked' : ''}`}
                            onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                        >
                            <Heart size={16} fill={video.user_liked ? "red" : "none"} color={video.user_liked ? "red" : "black"} />
                            <span>{video.likes || 0} Curtir</span>
                        </button>

                        <button className="xp-button action-btn" onClick={(e) => { e.stopPropagation(); onOpenComments(video); }}>
                            <MessageCircle size={16} />
                            <span>Comentar</span>
                        </button>

                        <button className="xp-button action-btn" onClick={(e) => { e.stopPropagation(); onShare(video); }}>
                            <Share2 size={16} />
                            <span>Share</span>
                        </button>

                        {canDelete && (
                            <button className="xp-button action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(video.id); }}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .window-title { display: flex; align-items: center; gap: 8px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .title-icon { width: 16px; height: 16px; border-radius: 2px; }
                
                .window-controls { display: flex; gap: 2px; }
                .win-btn {
                    width: 20px; height: 20px; border: 1px solid white; background: transparent;
                    color: white; font-size: 10px; display: flex; align-items: center; justify-content: center;
                    border-radius: 3px; cursor: pointer; opacity: 0.7;
                }
                .win-btn:hover { opacity: 1; background: rgba(255,255,255,0.2); }
                .win-btn.close { background: #E81123; border: none; }

                .video-window-body {
                    background: #ECE9D8; /* Classic XP Gray/Beige */
                    padding: 8px;
                    display: flex; flex-direction: column; gap: 10px;
                }

                .video-frame {
                    background: black;
                    border: 2px solid #999;
                    border-radius: 2px;
                    position: relative;
                    aspect-ratio: 9/16;
                    max-height: 400px;
                    display: flex; justify-content: center; overflow: hidden;
                    cursor: pointer;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                }

                .post-video { height: 100%; width: 100%; object-fit: contain; }

                .play-overlay {
                    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.2);
                }

                .play-toggle-btn {
                    position: absolute; bottom: 10px; right: 10px;
                    background: rgba(0,0,0,0.5); border: 1px solid white; color: white;
                    border-radius: 50%; width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }

                .post-meta {
                    background: white; border: 1px solid #7F9DB9; padding: 10px;
                }

                .post-info { font-size: 11px; color: #666; margin-bottom: 4px; display: flex; justify-content: space-between; }
                .post-description { font-size: 13px; color: black; margin-bottom: 12px; line-height: 1.4; }

                .post-actions-bar {
                    display: flex; gap: 8px; flex-wrap: wrap;
                }

                .action-btn { display: flex; align-items: center; gap: 6px; }
                .action-btn.liked { color: red; }
                .action-btn.delete { color: red; margin-left: auto; }
            `}</style>
        </motion.div>
    );
}
