import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`);
      setVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const upload = async () => {
    if (!file) return showToast('Escolha um vídeo primeiro!', 'error');

    setProgress(0);

    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
          }
        }
      );

      showToast('Vídeo enviado com sucesso! 🎉', 'success');
      setProgress(0);
      setFile(null);
      await loadVideos();
      setActiveTab('videos');
    } catch (err) {
      showToast('Erro ao enviar vídeo. Tente novamente.', 'error');
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      showToast('Arquivo carregado! Clique em "Publicar" para enviar.', 'success');
    } else {
      showToast('Por favor, arraste um arquivo de vídeo válido.', 'error');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease',
          maxWidth: 400
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
            <span style={{ fontWeight: 500 }}>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: '#212121',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #303030'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #ff0000, #cc0000)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 'bold'
          }}>▶</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>MeuStream</h1>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        background: '#212121',
        padding: '0 24px',
        display: 'flex',
        gap: 24,
        borderBottom: '1px solid #303030'
      }}>
        <button
          onClick={() => setActiveTab('videos')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'videos' ? '#fff' : '#aaa',
            fontSize: 15,
            fontWeight: 500,
            padding: '16px 0',
            cursor: 'pointer',
            borderBottom: activeTab === 'videos' ? '3px solid #fff' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Vídeos
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'upload' ? '#fff' : '#aaa',
            fontSize: 15,
            fontWeight: 500,
            padding: '16px 0',
            cursor: 'pointer',
            borderBottom: activeTab === 'upload' ? '3px solid #fff' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Upload
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        
        {/* ABA: VÍDEOS */}
        {activeTab === 'videos' && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
              {loading ? 'Carregando...' : `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`}
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 64 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: '4px solid #303030',
                  borderTop: '4px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
              </div>
            ) : videos.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 64,
                background: '#1a1a1a',
                borderRadius: 12,
                color: '#aaa'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
                <p style={{ fontSize: 18, margin: 0 }}>Nenhum vídeo enviado ainda</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  style={{
                    marginTop: 16,
                    padding: '10px 24px',
                    background: '#ff0000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Fazer primeiro upload
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24
              }}>
                {videos.map((v) => (
                  <div key={v.id} style={{
                    background: '#1a1a1a',
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <iframe
                      src={`https://iframe.mediadelivery.net/embed/548459/${v.bunny_id}?autoplay=false&preload=true`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        border: 'none'
                      }}
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                      allowFullScreen
                    />
                    <div style={{ padding: 12 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {v.title}
                      </h3>
                      <p style={{
                        margin: '8px 0 0',
                        fontSize: 13,
                        color: '#aaa'
                      }}>
                        {v.views || 0} visualizações
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: UPLOAD */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
              Enviar vídeo
            </h2>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                background: isDragging ? '#1e293b' : '#1a1a1a',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                border: isDragging ? '2px dashed #3ea6ff' : '2px dashed #404040',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                {isDragging ? '📥' : '☁️'}
              </div>
              
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {isDragging ? 'Solte o arquivo aqui!' : 'Arraste um vídeo ou clique para selecionar'}
              </p>
              
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  if (selectedFile) {
                    setFile(selectedFile);
                    showToast('Arquivo selecionado! Pronto para enviar.', 'success');
                  }
                }}
                style={{ display: 'none' }}
                id="file-input"
              />
              
              <label
                htmlFor="file-input"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  background: '#3ea6ff',
                  color: '#fff',
                  borderRadius: 20,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Selecionar arquivo
              </label>

              {file && (
                <div style={{
                  marginTop: 24,
                  padding: 16,
                  background: '#0f0f0f',
                  borderRadius: 8,
                  textAlign: 'left'
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>Arquivo selecionado:</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600 }}>{file.name}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#aaa' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <button
                onClick={upload}
                disabled={!file || progress > 0}
                style={{
                  marginTop: 24,
                  padding: '12px 48px',
                  background: !file || progress > 0 ? '#555' : '#ff0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: !file || progress > 0 ? 'not-allowed' : 'pointer',
                  display: 'block',
                  width: '100%'
                }}
              >
                {progress > 0 && progress < 100 ? `Enviando ${progress}%` : 'Publicar vídeo'}
              </button>

              {progress > 0 && progress < 100 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    width: '100%',
                    height: 6,
                    background: '#303030',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: '#3ea6ff',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
