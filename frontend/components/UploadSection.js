import { useState, useRef, useEffect } from 'react';
import { uploadVideo, uploadStory } from '../services/api';

function CameraCapture({ type, onCapture, onCancel }) {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const [facingMode, setFacingMode] = useState('user');
    const chunksRef = useRef([]);

    useEffect(() => {
        let currentStream = null;
        async function init() {
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode },
                    audio: type === 'video'
                });
                currentStream = s;
                if (videoRef.current) videoRef.current.srcObject = s;
            } catch (err) {
                console.error(err);
                alert("Erro ao acessar a câmera. Verifique as permissões de vídeo/áudio do seu navegador.");
                onCancel();
            }
        }
        init();
        return () => {
            if (currentStream) currentStream.getTracks().forEach(t => t.stop());
        };
    }, [facingMode, type, onCancel]);

    const handleCapturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
        }, 'image/jpeg', 0.9);
    };

    const handleStartRecording = () => {
        if (!videoRef.current || !videoRef.current.srcObject) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(videoRef.current.srcObject, { mimeType: 'video/webm' });
        recorder.ondataavailable = e => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
            onCapture(file);
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setRecording(true);
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted={type === 'video' ? true : false} 
                style={{ flex: 1, width: '100%', objectFit: 'contain', background: '#111' }} 
            />
            {recording && (
                <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,0,0,0.8)', color: 'white', padding: '4px 12px', borderRadius: 12, fontWeight: 'bold' }}>
                    Gravando...
                </div>
            )}
            
            <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px' }}>
                <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: 50, height: 50, fontSize: 20, cursor: 'pointer' }}>✖</button>
                
                {type === 'photo' ? (
                    <button onClick={handleCapturePhoto} style={{ background: 'white', borderRadius: '50%', width: 70, height: 70, border: '4px solid #aaa', cursor: 'pointer' }}></button>
                ) : (
                    <button onClick={recording ? handleStopRecording : handleStartRecording} 
                        style={{ background: recording ? '#ff4757' : 'white', borderRadius: '50%', width: 70, height: 70, border: '4px solid #aaa', transition: 'all 0.2s', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {recording && <span style={{ width: 24, height: 24, background: 'white', borderRadius: 4 }}/>}
                    </button>
                )}

                <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: 50, height: 50, fontSize: 24, cursor: 'pointer' }}>🔄</button>
            </div>
        </div>
    );
}

export default function UploadSection({ user, setShowAuth, showToast, loadVideos, setActiveTab }) {
    const [file, setFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isRestricted, setIsRestricted] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    // Config: Destino (Feed vs Story) e Tipo (Video vs Foto)
    const [destination, setDestination] = useState('feed'); // 'feed' | 'story'
    const [uploadType, setUploadType] = useState('video'); // 'video' | 'photo'

    const upload = async () => {
        if (!user) {
            setShowAuth(true);
            return showToast('Faça login para enviar conteúdo', 'error');
        }
        if (!file) return showToast(`Escolha um ${uploadType === 'video' ? 'vídeo' : 'foto'}!`, 'error');

        const maxSize = 50 * 1024 * 1024; // 50MB (Story ou Feed)
        if (file.size > maxSize) {
            return showToast('Arquivo muito grande! Máximo: 50MB', 'error');
        }

        // Validar tipo de arquivo
        if (uploadType === 'video') {
            const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
            if (!allowedVideo.includes(file.type)) {
                return showToast('Formato de vídeo inválido!', 'error');
            }
        } else {
            if (!file.type.startsWith('image/')) {
                return showToast('Formato de imagem inválido!', 'error');
            }
        }

        setProgress(0);
        const form = new FormData();
        form.append('file', file);

        // Campos específicos por destino
        if (destination === 'feed') {
            const finalTitle = videoTitle.trim() || file.name;
            form.append('title', finalTitle);
            form.append('description', description);
            form.append('user_id', user.id.toString());
            form.append('is_restricted', isRestricted.toString());
            form.append('type', uploadType);
            if (thumbnailFile && uploadType === 'video') {
                form.append('thumbnail', thumbnailFile);
            }
        } else {
            // Story
            form.append('caption', description); // Reusando campo descrição como legenda
            form.append('type', uploadType); // O backend detecta mime, mas ok enviar
        }

        try {
            if (destination === 'feed') {
                await uploadVideo(form, (e) => {
                    const percent = Math.round((e.loaded * 100) / e.total);
                    setProgress(percent);
                });
            } else {
                await uploadStory(form, (e) => {
                    const percent = Math.round((e.loaded * 100) / e.total);
                    setProgress(percent);
                });
            }

            showToast(`${destination === 'story' ? 'Story' : (uploadType === 'video' ? 'Vídeo' : 'Foto')} enviado! 🎉`, 'success');
            setProgress(0);
            setFile(null);
            setThumbnailFile(null);
            setVideoTitle('');
            setDescription('');
            setIsRestricted(false);

            // Redirecionar
            if (destination === 'story') {
                setActiveTab('feed'); // Volta pro feed pra ver o story
            } else {
                if (loadVideos) await loadVideos();
                if (isRestricted) {
                    setActiveTab('secret');
                } else {
                    setActiveTab('feed');
                }
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Erro ao enviar', 'error');
            setProgress(0);
        }
    };

    if (showCamera) {
        return (
            <CameraCapture 
                type={uploadType} 
                onCapture={(f) => { 
                    setFile(f); 
                    showToast('Arquivo capturado com sucesso!', 'success'); 
                    setShowCamera(false); 
                }} 
                onCancel={() => setShowCamera(false)} 
            />
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', color: 'var(--text-color)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>📤 Enviar Conteúdo</h2>

            {/* Seletor de Destino (Feed ou Story) */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                    onClick={() => setDestination('feed')}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: destination === 'feed' ? 'var(--accent-color)' : 'var(--input-bg)',
                        color: destination === 'feed' ? '#fff' : 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                >
                    📰 No Feed
                </button>
                <button
                    onClick={() => setDestination('story')}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: destination === 'story' ? '#d62976' : 'var(--input-bg)', // Cor Instagram ish
                        color: destination === 'story' ? '#fff' : 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                >
                    ⭕ No Story (24h)
                </button>
            </div>

            {/* Seletor de Tipo (Video vs Foto) */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                    onClick={() => setUploadType('video')}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: uploadType === 'video' ? '#0078D4' : 'var(--input-bg)',
                        color: '#fff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                >
                    🎥 Vídeo
                </button>
                <button
                    onClick={() => setUploadType('photo')}
                    style={{
                        flex: 1,
                        padding: 12,
                        background: uploadType === 'photo' ? '#fe7d45' : 'var(--input-bg)',
                        color: uploadType === 'photo' ? '#fff' : 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                    }}
                >
                    📸 Foto
                </button>
            </div>

            <div
                style={{
                    border: isDragging ? '3px dashed var(--accent-color)' : '2px dashed var(--border-color)',
                    borderRadius: 16,
                    padding: 48,
                    textAlign: 'center',
                    background: isDragging ? 'rgba(141, 106, 255, 0.1)' : 'var(--card-bg)',
                    marginBottom: 24,
                    transition: 'all 0.3s'
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) {
                        setFile(f);
                        showToast('Arquivo selecionado!', 'success');
                    }
                }}
            >
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                    {uploadType === 'video' ? '🎬' : '🖼️'}
                </div>
                <p style={{ fontSize: 18, margin: '0 0 24px', color: 'var(--secondary-text)' }}>
                    {isDragging ? `Solte o ${uploadType} aqui!` : `Como deseja enviar o ${uploadType === 'video' ? 'vídeo' : 'foto'}?`}
                </p>

                {!isDragging && (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => document.getElementById('file-input-gallery').click()}
                            style={{
                                padding: '12px 24px',
                                background: 'var(--accent-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            📁 Galeria
                        </button>
                        <button
                            onClick={() => setShowCamera(true)}
                            style={{
                                padding: '12px 24px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {uploadType === 'video' ? '🎥 Gravar Agora' : '📸 Tirar Agora'}
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    accept={uploadType === 'video' ? "video/*" : "image/*"}
                    onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                            setFile(f);
                            showToast('Arquivo selecionado!', 'success');
                        }
                    }}
                    style={{ display: 'none' }}
                    id="file-input-gallery"
                />
            </div>

            {file && (
                <>
                    <div style={{ background: 'var(--card-bg)', padding: 20, borderRadius: 12, marginBottom: 20, border: '1px solid var(--border-color)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--secondary-text)' }}>Arquivo selecionado:</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{file.name}</p>
                        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--secondary-text)', opacity: 0.8 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    {destination === 'feed' && (
                        <input
                            type="text"
                            placeholder={`📁 Nome do arquivo: ${file.name}`}
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            style={{ width: '100%', padding: 14, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-color)', fontSize: 16, marginBottom: 16 }}
                        />
                    )}

                    <textarea
                        placeholder={destination === 'story' ? "📝 Legenda (opcional)" : "📝 Descrição"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        style={{ width: '100%', padding: 14, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-color)', fontSize: 15, marginBottom: 16, resize: 'vertical' }}
                    />

                    {destination === 'feed' && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 12, fontSize: 16, fontWeight: 500 }}>
                                🖼️ Thumbnail personalizada (opcional):
                            </label>
                            <button
                                onClick={() => document.getElementById('thumbnail-input').click()}
                                style={{
                                    padding: '12px 20px',
                                    background: 'var(--input-bg)',
                                    color: 'var(--text-color)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Selecionar Thumbnail
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const thumb = e.target.files[0];
                                    if (thumb) {
                                        setThumbnailFile(thumb);
                                        showToast('Thumbnail selecionada!', 'success');
                                    }
                                }}
                                style={{ display: 'none' }}
                                id="thumbnail-input"
                            />
                            {thumbnailFile && (
                                <p style={{ marginTop: 10, color: '#10b981', fontSize: 14 }}>
                                    ✓ {thumbnailFile.name}
                                </p>
                            )}
                        </div>
                    )}

                    {destination === 'feed' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isRestricted}
                                onChange={(e) => setIsRestricted(e.target.checked)}
                                style={{ width: 20, height: 20, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 16 }}>🔒 Tornar vídeo privado (apenas +18)</span>
                        </label>
                    )}

                    {progress > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ background: 'var(--input-bg)', height: 28, borderRadius: 14, overflow: 'hidden', position: 'relative', border: '1px solid var(--border-color)' }}>
                                <div style={{
                                    background: 'linear-gradient(90deg, var(--accent-color), #fe7d45)',
                                    height: '100%',
                                    width: `${progress}%`,
                                    transition: 'width 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#fff'
                                }}>
                                    {progress}%
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={upload}
                        disabled={progress > 0}
                        style={{
                            width: '100%',
                            padding: 16,
                            background: progress > 0 ? '#555' : (destination === 'story' ? '#d62976' : (isRestricted ? '#e53e3e' : 'var(--accent-color)')),
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 18,
                            fontWeight: 600,
                            cursor: progress > 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        {progress > 0 ? `Enviando... ${progress}%` : (
                            destination === 'story' ? '🚀 Postar Story' : (isRestricted ? '🔒 Enviar Vídeo Privado' : '🚀 Enviar Conteúdo')
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
