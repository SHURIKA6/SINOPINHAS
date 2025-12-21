import { memo, useState, useEffect, useRef } from "react";

const VideoCard = memo(({ video, onDelete, onLike, onOpenComments, canDelete, isSecret, onShare }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    const cardRef = useRef(null);
    const videoRef = useRef(null);
    const lastTap = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.05, rootMargin: '100px' });

        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(p);
    };

    const handleDoubleTap = (e) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Vibração Haptic
            if ('vibrate' in navigator) navigator.vibrate(50);
            onLike(video.id, e);
            setShowPlayIcon('heart');
            setTimeout(() => setShowPlayIcon(false), 800);
        } else {
            togglePlay();
        }
        lastTap.current = now;
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: video.description,
                    url: window.location.href + `?v=${video.id}`,
                });
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            onShare && onShare(video);
        }
    };

    return (
        <div
            ref={cardRef}
            style={{
                background: isSecret ? "#3d1a1a" : "var(--card-bg)",
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
                boxShadow: isSecret ? "0 4px 28px rgba(229, 62, 62, 0.3)" : "var(--shadow-lg)",
                paddingBottom: 6,
                border: isSecret ? '2px solid #e53e3e' : '1px solid var(--border-color)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
            }}
            className="card-hover"
        >
            {canDelete && (
                <button
                    onClick={() => onDelete(video.id, video.user_id)}
                    style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 100,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                        border: 'none', borderRadius: '50%', width: 36, height: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff'
                    }}
                >
                    🗑️
                </button>
            )}

            <div
                className="video-container"
                onClick={handleDoubleTap}
                style={{
                    aspectRatio: "16/9",
                    borderRadius: 0,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    cursor: 'pointer'
                }}
            >
                {isVisible ? (
                    video.type === 'photo' ? (
                        <img
                            src={video.video_url}
                            alt={video.title}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: 'cover' }}
                        />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                src={video.video_url}
                                muted
                                loop
                                playsInline
                                onTimeUpdate={handleTimeUpdate}
                                style={{ width: "100%", height: "100%", objectFit: 'cover' }}
                            />

                            {/* Player UI Overlay */}
                            <div className="player-overlay">
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <span style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4, fontSize: 10 }}>SINOPINHAS TV</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {/* Seek Bar */}
                                    <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-color)', borderRadius: 2 }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20 }}>
                                            {isPlaying ? '⏸️' : '▶️'}
                                        </button>
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>{video.views || 0} views</span>
                                    </div>
                                </div>
                            </div>

                            {/* Center Icons (Like/Play) */}
                            {showPlayIcon === 'heart' && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 80, animation: 'heartPop 0.8s ease-out' }}>❤️</div>
                            )}
                        </>
                    )
                ) : (
                    <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                )}
            </div>

            <div style={{ padding: 18 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-color)' }}>{video.title}</h3>
                <p style={{ margin: '8px 0', fontSize: 14, color: 'var(--secondary-text)', lineHeight: 1.5, opacity: 0.8 }}>
                    {video.description || "Sem descrição..."}
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button
                        onClick={(e) => {
                            if ('vibrate' in navigator) navigator.vibrate(30);
                            onLike(video.id, e);
                        }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 12, background: video.user_liked ? 'rgba(255,107,157,0.1)' : 'var(--input-bg)',
                            border: '1px solid', borderColor: video.user_liked ? '#ff6b9d' : 'var(--border-color)',
                            color: video.user_liked ? '#ff6b9d' : 'var(--text-color)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
                        }}
                    >
                        {video.user_liked ? '❤️' : '🤍'} {video.likes || 0}
                    </button>

                    <button
                        onClick={() => onOpenComments(video)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: 12, background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)', color: 'var(--text-color)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
                        }}
                    >
                        💬 Comentar
                    </button>

                    <button
                        onClick={handleNativeShare}
                        style={{
                            width: 44, height: 44, borderRadius: 12, background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)', color: 'var(--text-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        📤
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes heartPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                }
            `}</style>
        </div>
    );
});

VideoCard.displayName = 'VideoCard';
export default VideoCard;
