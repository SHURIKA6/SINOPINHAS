import { useState } from 'react';
import { uploadVideo } from '../services/api';

export default function UploadSection({ user, setShowAuth, showToast, loadVideos, setActiveTab }) {
    const [file, setFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isRestricted, setIsRestricted] = useState(false);

    const upload = async () => {
        if (!user) {
            setShowAuth(true);
            return showToast('Faça login para enviar vídeos', 'error');
        }
        if (!file) return showToast('Escolha um vídeo!', 'error');

        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            return showToast('Vídeo muito grande! Máximo: 500MB', 'error');
        }

        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(file.type)) {
            return showToast('Formato inválido! Use MP4, WebM, OGG, MOV ou AVI', 'error');
        }

        const finalTitle = videoTitle.trim() || file.name;

        setProgress(0);
        const form = new FormData();
        form.append('file', file);
        form.append('title', finalTitle);
        form.append('user_id', user.id.toString());
        form.append('is_restricted', isRestricted.toString());

        if (thumbnailFile) {
            form.append('thumbnail', thumbnailFile);
        }

        try {
            await uploadVideo(form, (e) => {
                const percent = Math.round((e.loaded * 100) / e.total);
                setProgress(percent);
            });
            showToast('Vídeo enviado! 🎉', 'success');
            setProgress(0);
            setFile(null);
            setThumbnailFile(null);
            setVideoTitle('');
            setIsRestricted(false);
            await loadVideos();
            if (isRestricted) {
                setActiveTab('secret');
            } else {
                setActiveTab('videos');
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Erro ao enviar', 'error');
            setProgress(0);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>📤 Enviar Vídeo</h2>

            <div
                style={{
                    border: isDragging ? '3px dashed #8d6aff' : '2px dashed #444',
                    borderRadius: 16,
                    padding: 48,
                    textAlign: 'center',
                    background: isDragging ? '#8d6aff22' : '#1a1a1a',
                    cursor: 'pointer',
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
                onClick={() => document.getElementById('file-input').click()}
            >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <p style={{ fontSize: 18, margin: 0, color: '#aaa' }}>
                    {isDragging ? 'Solte o vídeo aqui!' : 'Arraste um vídeo ou clique para selecionar'}
                </p>
                <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                            setFile(f);
                            showToast('Arquivo selecionado!', 'success');
                        }
                    }}
                    style={{ display: 'none' }}
                    id="file-input"
                />
            </div>

            {file && (
                <>
                    <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12, marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#aaa' }}>Arquivo selecionado:</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{file.name}</p>
                        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#888' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    <input
                        type="text"
                        placeholder={`📁 Nome do arquivo: ${file.name}`}
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        style={{ width: '100%', padding: 14, background: '#1a1a1a', border: '1px solid #303030', borderRadius: 10, color: '#fff', fontSize: 16, marginBottom: 16 }}
                    />

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 12, fontSize: 16, fontWeight: 500 }}>
                            🖼️ Thumbnail personalizada (opcional):
                        </label>
                        <button
                            onClick={() => document.getElementById('thumbnail-input').click()}
                            style={{
                                padding: '12px 20px',
                                background: '#303030',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 500
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

                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isRestricted}
                            onChange={(e) => setIsRestricted(e.target.checked)}
                            style={{ width: 20, height: 20, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 16 }}>🔒 Tornar vídeo privado (apenas +18)</span>
                    </label>

                    {progress > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ background: '#303030', height: 28, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                                <div style={{
                                    background: 'linear-gradient(90deg, #8d6aff, #fe7d45)',
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
                            background: progress > 0 ? '#555' : (isRestricted ? '#e53e3e' : '#8d6aff'),
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 18,
                            fontWeight: 600,
                            cursor: progress > 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        {progress > 0 ? `Enviando... ${progress}%` : (isRestricted ? '🔒 Enviar Vídeo Privado' : '🚀 Enviar Vídeo')}
                    </button>
                </>
            )}
        </div>
    );
}
