import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

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

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      return showToast('Preencha todos os campos', 'error');
    }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        username,
        password
      });

      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setShowAuth(false);
      setUsername('');
      setPassword('');
      showToast(isLogin ? 'Login realizado!' : 'Conta criada com sucesso!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao autenticar', 'error');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    showToast('Logout realizado', 'success');
  };

  const upload = async () => {
    if (!user) {
      setShowAuth(true);
      return showToast('Faça login para enviar vídeos', 'error');
    }

    if (!file) return showToast('Escolha um vídeo primeiro!', 'error');

    setProgress(0);
    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name);
    form.append('userId', user.id.toString());

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        }
      });

      showToast('Vídeo enviado com sucesso! 🎉', 'success');
      setProgress(0);
      setFile(null);
      await loadVideos();
      setActiveTab('videos');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao enviar vídeo', 'error');
      setProgress(0);
    }
  };

  const deleteVideo = async (videoId) => {
    if (!user) return showToast('Faça login para deletar vídeos', 'error');
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`, {
        data: { userId: user.id.toString() }
      });

      showToast('Vídeo deletado com sucesso!', 'success');
      await loadVideos();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao deletar vídeo', 'error');
    }
  };

  const canDelete = (ownerId) => user && user.id.toString() === ownerId;

  return (
    <>
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff', padding: '16px 24px', borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
              <span style={{ fontWeight: 500 }}>{toast.message}</span>
            </div>
          </div>
        )}

        {showAuth && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowAuth(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px', fontSize: 24 }}>
                {isLogin ? 'Login' : 'Criar Conta'}
              </h2>
              
              <form onSubmit={handleAuth}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />
                
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />

                <button type="submit" style={{
                  width: '100%', padding: 12, background: '#ff0000',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16
                }}>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>

                <button type="button" onClick={() => setIsLogin(!isLogin)} style={{
                  width: '100%', padding: 12, background: 'none',
                  color: '#aaa', border: 'none', fontSize: 14, cursor: 'pointer'
                }}>
                  {isLogin ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
                </button>
              </form>
            </div>
          </div>
        )}

        <header style={{
          background: '#212121', padding: '16px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #303030'
        }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>SINOPINHAS</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <span style={{ fontSize: 14, color: '#aaa' }}>
                  Olá, <strong style={{ color: '#fff' }}>{user.username}</strong>
                </span>
                <button onClick={logout} style={{
                  padding: '8px 16px', background: '#303030', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer'
                }}>
                  Sair
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                padding: '8px 16px', background: '#ff0000', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>
                Login
              </button>
            )}
          </div>
        </header>

        <div style={{ background: '#212121', padding: '0 24px', display: 'flex', gap: 24, borderBottom: '1px solid #303030' }}>
          {['videos', 'upload'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', color: activeTab === tab ? '#fff' : '#aaa',
              fontSize: 15, fontWeight: 500, padding: '16px 0', cursor: 'pointer',
              borderBottom: activeTab === tab ? '3px solid #fff' : '3px solid transparent',
              transition: 'all 0.2s', textTransform: 'capitalize'
            }}>
              {tab === 'videos' ? 'Vídeos' : 'Upload'}
            </button>
          ))}
        </div>

        <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
          {activeTab === 'videos' && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
                {loading ? 'Carregando...' : `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`}
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 64 }}>
                  <div style={{
                    width: 48, height: 48, border: '4px solid #303030', borderTop: '4px solid #fff',
                    borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'
                  }} />
                </div>
              ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 12 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
                  <p style={{ fontSize: 18, margin: 0 }}>Nenhum vídeo enviado ainda</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {videos.map((v) => (
                    <div key={v.id} style={{
                      background: '#1a1a1a', borderRadius: 12, overflow: 'hidden', position: 'relative'
                    }}>
                      {canDelete(v.owner_id) && (
                        <button onClick={() => deleteVideo(v.id)} style={{
                          position: 'absolute', top: 8, right: 8, zIndex: 10,
                          background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%',
                          width: 36, height: 36, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff'
                        }}>
                          🗑️
                        </button>
                      )}
                      <iframe
                        src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false&preload=true`}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '16/9', border: 'none' }}
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                        allowFullScreen
                      />
                      <div style={{ padding: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.title}
                        </h3>
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#aaa' }}>
                          Por {v.username || 'Anônimo'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Enviar vídeo</h2>
              
              {!user && (
                <div style={{
                  background: '#1a1a1a', padding: 24, borderRadius: 12, marginBottom: 24,
                  textAlign: 'center', border: '2px dashed #ff0000'
                }}>
                  <p style={{ margin: '0 0 16px', fontSize: 16 }}>
                    Você precisa estar logado para enviar vídeos
                  </p>
                  <button onClick={() => setShowAuth(true)} style={{
                    padding: '12px 32px', background: '#ff0000', color: '#fff',
                    border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: 'pointer'
                  }}>
                    Fazer Login
                  </button>
                </div>
              )}

              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && droppedFile.type.startsWith('video/')) {
                    setFile(droppedFile);
                    showToast('Arquivo carregado!', 'success');
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                style={{
                  background: isDragging ? '#1e293b' : '#1a1a1a', borderRadius: 12, padding: 32,
                  textAlign: 'center', border: isDragging ? '2px dashed #3ea6ff' : '2px dashed #404040',
                  opacity: !user ? 0.5 : 1, pointerEvents: !user ? 'none' : 'auto'
                }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{isDragging ? '📥' : '☁️'}</div>
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
                      showToast('Arquivo selecionado!', 'success');
                    }
                  }}
                  style={{ display: 'none' }}
                  id="file-input"
                />
                
                <label htmlFor="file-input" style={{
                  display: 'inline-block', padding: '12px 32px', background: '#3ea6ff', color: '#fff',
                  borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8
                }}>
                  Selecionar arquivo
                </label>

                {file && (
                  <div style={{ marginTop: 24, padding: 16, background: '#0f0f0f', borderRadius: 8, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>Arquivo selecionado:</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600 }}>{file.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#aaa' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <button onClick={upload} disabled={!file || progress > 0} style={{
                  marginTop: 24, padding: '12px 48px',
                  background: !file || progress > 0 ? '#555' : '#ff0000',
                  color: '#fff', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 600,
                  cursor: !file || progress > 0 ? 'not-allowed' : 'pointer', display: 'block', width: '100%'
                }}>
                  {progress > 0 && progress < 100 ? `Enviando ${progress}%` : 'Publicar vídeo'}
                </button>

                {progress > 0 && progress < 100 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ width: '100%', height: 6, background: '#303030', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#3ea6ff', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
