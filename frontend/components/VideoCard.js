import { memo, useState, useEffect, useRef } from "react";

const VideoCard = memo(({ video, onDelete, onLike, onOpenComments, canDelete, isSecret, onShare }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const cardRef = useRef(null);

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

    return (
        <div
            ref={cardRef}
            style={{
                background: isSecret ? "#3d1a1a" : "var(--card-bg)",
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
                boxShadow: isSecret ? "0 4px 28px rgba(229, 62, 62, 0.3)" : "0 4px 28px rgba(0, 0, 0, 0.2)",
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
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 18,
                        color: '#fff'
                    }}
                >
                    🗑️
                </button>
            )}

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
                        <>
                            {!isLoaded && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(45deg, #130c23, #1e1432)',
                                    animation: 'pulse 1.5s infinite'
                                }} />
                            )}
                            <img
                                src={video.video_url}
                                alt={video.title}
                                onLoad={() => setIsLoaded(true)}
                                loading="lazy"
                                decoding="async"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: 'contain',
                                    transition: 'opacity 0.6s ease',
                                    opacity: isLoaded ? 1 : 0
                                }}
                            />
                        </>
                    ) : video.video_url ? (
                        <video
                            src={video.video_url}
                            controls
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="video-player"
                            style={{ width: "100%", borderRadius: "12px", background: "#000" }}
                        />
                    ) : video.gdrive_id ? (
                        <iframe
                            src={`https://drive.google.com/file/d/${video.gdrive_id}/preview`}
                            style={{ width: "100%", height: "100%", border: 'none' }}
                            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                            allowFullScreen
                            loading="lazy"
                        />
                    ) : video.bunny_id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', flexDirection: 'column', gap: 10 }}>
                            <span>⚠️ Conteúdo indisponível</span>
                        </div>
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            Sem conteúdo
                        </div>
                    )
                ) : (
                    <div style={{
                        width: "100%",
                        height: "100%",
                        background: 'linear-gradient(45deg, #0d0221, #130c23)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ opacity: 0.2, fontSize: 32 }}>🎬</span>
                    </div>
                )}
            </div>

            <div style={{ padding: 14 }}>
                {isSecret && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: '#e53e3e', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', color: '#fff' }}>🔒 PRIVADO</span>
                    </div>
                )}
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</h3>
                <p style={{ margin: '9px 0 0', fontSize: 13, color: 'var(--secondary-text)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 45 }}>
                    {video.description || "Sem descrição disponível."}
                </p>
                <div style={{ marginTop: 12, fontSize: 15, color: isSecret ? "#ffb3b3" : "var(--accent-color)", display: 'flex', gap: 15 }}>
                    <button
                        onClick={(e) => onLike(video.id, e)}
                        className={`like-btn ${video.user_liked ? 'liked' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: video.user_liked ? '#ff6b9d' : (isSecret ? '#ffb3b3' : 'var(--accent-color)'),
                            cursor: 'pointer',
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        <span style={{ fontSize: 18 }}>{video.user_liked ? '❤️' : '🤍'}</span>
                        <span style={{ fontWeight: 800 }}>{video.likes || 0}</span>
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>👁️ <span style={{ fontWeight: 800 }}>{video.views || 0}</span></span>
                </div>

                <style jsx>{`
                    .like-btn:active {
                        transform: scale(0.8);
                    }
                    .like-btn.liked span:first-child {
                        animation: heartPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    @keyframes heartPop {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.5); }
                        100% { transform: scale(1); }
                    }
                `}</style>
                <button
                    onClick={() => onShare && onShare(video)}
                    style={{
                        marginTop: 8, background: 'var(--input-bg)', border: '1px solid var(--border-color)',
                        borderRadius: 6, color: 'var(--text-color)', padding: '6px 12px', width: '100%',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.3s ease'
                    }}
                >
                    📤 Enviar / Compartilhar
                </button>

                <button
                    onClick={() => onOpenComments(video)}
                    style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '8px',
                        background: isSecret ? '#5b2f2f' : 'var(--accent-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                >
                    💬 Ver Comentários
                </button>
            </div>
        </div>
    );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;
