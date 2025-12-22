import { memo, useState, useEffect, useRef } from "react";
import { useFavorites } from "../hooks/useFavorites";

const VideoCard = memo(({ video, onDelete, onLike, onOpenComments, canDelete, isSecret, onShare }) => {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);
    const lastTap = useRef(0);
    const { toggleFavorite, isFavorite } = useFavorites();

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

    const handleDoubleTap = (e) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if ('vibrate' in navigator) navigator.vibrate(50);
            onLike(video.id, e);
        }
        lastTap.current = now;
    };

    const handleShareClick = () => {
        if (onShare) {
            onShare(video);
        } else {
            handleNativeShare();
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: video.title,
                    text: video.description,
                    url: window.location.href + `?v=${video.id}`,
                });
            } catch (err) { }
        }
    };

    const handleFavorite = (e) => {
        e.stopPropagation();
        toggleFavorite('videos', video);
        if ('vibrate' in navigator) navigator.vibrate(30);
    };

    return (
        <div
            ref={cardRef}
            onClick={handleDoubleTap}
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
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 8 }}>
                <button
                    onClick={handleFavorite}
                    style={{
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                        width: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#fff',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    {isFavorite('videos', video) ? '⭐' : '☆'}
                </button>
                {canDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(video.id, video.user_id); }}
                        style={{
                            background: 'rgba(255, 68, 68, 0.6)', border: 'none', borderRadius: '50%',
                            width: 36, height: 36, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', color: '#fff',
                            backdropFilter: 'blur(8px)'
                        }}
                    >🗑️</button>
                )}
            </div>

            <div style={{
                width: "100%",
                aspectRatio: "16/9",
                background: isSecret ? "#1a0c0c" : "#130c23",
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {isVisible ? (
                    video.type === 'photo' ? (
                        <img
                            src={video.video_url}
                            alt={video.title}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                        />
                    ) : (
                        <video
                            src={video.video_url}
                            controls
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            style={{ width: "100%", height: "100%", background: "#000" }}
                        />
                    )
                ) : (
                    <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                )}
            </div>

            <div style={{ padding: 18 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-color)' }}>{video.title}</h3>
                <p style={{ margin: '8px 0', fontSize: 14, color: 'var(--secondary-text)', lineHeight: 1.5, minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {video.description || "Sem descrição..."}
                </p>

                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onLike(video.id, e); }}
                        style={{
                            flex: 1, padding: '8px', borderRadius: 12, background: video.user_liked ? 'rgba(255,107,157,0.1)' : 'var(--input-bg)',
                            border: '1px solid', borderColor: video.user_liked ? '#ff6b9d' : 'var(--border-color)',
                            color: video.user_liked ? '#ff6b9d' : 'var(--text-color)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer'
                        }}
                    >
                        {video.user_liked ? '❤️' : '🤍'} {video.likes || 0}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenComments(video); }}
                        style={{
                            flex: 1, padding: '8px', borderRadius: 12, background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)', color: 'var(--text-color)',
                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer'
                        }}
                    >💬 {video.comments_count || 0}</button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleShareClick(); }}
                        style={{
                            width: 40, height: 40, borderRadius: 12, background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >📤</button>
                </div>
            </div>
        </div>
    );
});

VideoCard.displayName = 'VideoCard';
export default VideoCard;
