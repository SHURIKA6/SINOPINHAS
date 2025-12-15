import { memo } from "react";

const VideoCard = memo(({ video, onDelete, onLike, onOpenComments, canDelete, isSecret }) => {
    return (
        <div style={{
            background: isSecret ? "#3d1a1a" : "#20153e",
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            boxShadow: isSecret ? "0 4px 28px #e53e3e55" : "0 4px 28px #18142355",
            paddingBottom: 6,
            border: isSecret ? '2px solid #e53e3e' : 'none'
        }}>
            {canDelete && (
                <button
                    onClick={() => onDelete(video.id, video.user_id)}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.8)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
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

            <div style={{ width: "100%", aspectRatio: "16/9", background: isSecret ? "#1a0c0c" : "#130c23", position: 'relative' }}>
                {video.video_url ? (
                    <video
                        src={video.video_url}
                        controls
                        style={{ width: "100%", height: "100%", objectFit: 'contain' }}
                        poster={video.thumbnail || null}
                    />
                ) : video.gdrive_id ? (
                    <iframe
                        src={`https://drive.google.com/file/d/${video.gdrive_id}/preview`}
                        style={{ width: "100%", height: "100%", border: 'none' }}
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                        allowFullScreen
                    />
                ) : video.bunny_id ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', flexDirection: 'column', gap: 10 }}>
                        <span>⚠️ Vídeo indisponível (BunnyCDN expirado)</span>
                    </div>
                ) : (
                    <div style={{ width: "100%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                        Sem vídeo
                    </div>
                )}
            </div>

            <div style={{ padding: 14 }}>
                {isSecret && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ background: '#e53e3e', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>🔒 PRIVADO</span>
                    </div>
                )}
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</h3>
                <p style={{ margin: '9px 0 0', fontSize: 13, color: '#ddd', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 45 }}>
                    {video.description || "Sem descrição disponível."}
                </p>
                <div style={{ marginTop: 12, fontSize: 15, color: isSecret ? "#ffb3b3" : "#c2bcf7", display: 'flex', gap: 15 }}>
                    <button
                        onClick={() => onLike(video.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: video.user_liked ? '#ff6b9d' : (isSecret ? '#ffb3b3' : '#c2bcf7'),
                            cursor: 'pointer',
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                        }}
                    >
                        {video.user_liked ? '❤️' : '🤍'} {video.likes || 0}
                    </button>
                    <span>👁️ {video.views || 0}</span>
                </div>

                <button
                    onClick={() => onOpenComments(video)}
                    style={{
                        marginTop: 12,
                        width: '100%',
                        padding: '8px',
                        background: isSecret ? '#5b2f2f' : '#352f5b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
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
