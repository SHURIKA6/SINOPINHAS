import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdminPassword) {
      setAdminPassword(savedAdminPassword);
      setIsAdmin(true);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/videos`);
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
    if (!username || !password) return showToast('Preencha todos os campos', 'error');
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(endpoint, { username, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setShowAuth(false);
      setUsername('');
      setPassword('');
      showToast(isLogin ? 'Login realizado!' : 'Conta criada!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao autenticar', 'error');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', { password: adminPassword });
      if (res.data.success) {
        setIsAdmin(true);
        localStorage.setItem('adminPassword', adminPassword);
        setShowAdminAuth(false);
        setActiveTab('admin');
        showToast('Acesso admin concedido!', 'success');
      }
    } catch (err) {
      showToast('Senha admin incorreta', 'error');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    showToast('Logout realizado', 'success');
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setAdminPassword('');
    localStorage.removeItem('adminPassword');
    setActiveTab('videos');
    showToast('Saiu do modo admin', 'success');
  };

  const upload = async () => {
    if (!user) {
      setShowAuth(true);
      return showToast('Faça login para enviar vídeos', 'error');
    }
    if (!file) return showToast('Escolha um vídeo!', 'error');
    setProgress(0);
    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name);
    form.append('user_id', user.id.toString());
    try {
      await axios.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        }
      });
      showToast('Vídeo enviado! 🎉', 'success');
      setProgress(0);
      setFile(null);
      await loadVideos();
      setActiveTab('videos');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao enviar', 'error');
      setProgress(0);
    }
  };

  const deleteVideo = async (videoId, ownerId) => {
    if (!user && !isAdmin) return showToast('Faça login para deletar', 'error');
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;
    try {
      const deleteData = isAdmin
        ? { adminPassword }
        : { userId: user.id.toString() };
      await axios.delete(`/api/videos/${videoId}`, { data: deleteData });
      showToast('Vídeo deletado!', 'success');
      await loadVideos();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao deletar', 'error');
    }
  };

  const canDelete = (ownerId) => isAdmin || (user && user.id.toString() === ownerId);

  return (
    <>
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <meta name="theme-color" content="#18142a" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>▶️</text></svg>" />
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #18142a 80%, #8d6aff 100%)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff', padding: '16px 24px', borderRadius: 12,
            boxShadow: '0 4px 12px #18142a33', animation: 'slideIn 0.3s ease'
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
              maxWidth: 400, width: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px' }}>{isLogin ? 'Login' : 'Criar Conta'}</h2>
              <form onSubmit={handleAuth}>
                <input
                  type="text" placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />
                <input
                  type="password" placeholder="Senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />
                <button type="submit" style={{
                  width: '100%', padding: 12, background: '#8d6aff',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16
                }}>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
                <button type="button" onClick={() => setIsLogin(!isLogin)} style={{
                  width: '100%', padding: 12, background: 'none',
                  color: '#aaa', border: 'none', fontSize: 14, cursor: 'pointer'
                }}>
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showAdminAuth && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowAdminAuth(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px' }}>🔒 Acesso Admin</h2>
              <form onSubmit={handleAdminLogin}>
                <input
                  type="password" placeholder="Senha de admin"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />
                <button type="submit" style={{
                  width: '100%', padding: 12, background: '#10b981',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer'
                }}>
                  Entrar como Admin
                </button>
              </form>
            </div>
          </div>
        )}

        <header style={{
          background: '#212121', padding: '16px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #303030'
        }}>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            letterSpacing: "2px", background: "linear-gradient(90deg,#8d6aff,#fe7d45 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>SINOPINHAS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            {isAdmin && (
              <span style={{
                padding: '6px 12px', background: '#10b981', borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: "#fff"
              }}>
                ADMIN
              </span>
            )}
            {user ? (
              <>
                <span style={{ fontSize: 16, color: '#aaa' }}>
                  <strong style={{ color: '#fff' }}>{user.username}</strong>
                </span>
                <button onClick={logout} style={{
                  padding: '7px 16px', background: '#303030', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer'
                }}>Sair</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                padding: '7px 16px', background: '#8d6aff', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}>Login</button>
            )}
            {!isAdmin ? (
              <button onClick={() => setShowAdminAuth(true)} style={{
                padding: '7px 16px', background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}>Admin</button>
            ) : (
              <button onClick={logoutAdmin} style={{
                padding: '7px 16px', background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer'
              }}>Sair Admin</button>
            )}
          </div>
        </header>

        <div style={{ background: '#212121', padding: '0 24px', display: 'flex', gap: 24, borderBottom: '2px solid #303030' }}>
          {['videos', 'upload'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', color: activeTab === tab ? '#fff' : '#aaa',
              fontSize: 17, fontWeight: 500, padding: '16px 0', cursor: 'pointer',
              borderBottom: activeTab === tab ? '3px solid #8d6aff' : '3px solid transparent',
              transition: 'all .18s', textTransform: 'capitalize'
            }}>
              {tab === 'videos' ? 'Vídeos' : 'Upload'}
            </button>
          ))}
        </div>

        <div style={{ padding: 38, maxWidth: 1160, margin: '0 auto' }}>
          {activeTab === 'videos' && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
                {loading ? 'Carregando...' : `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`}
              </h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{
                    width: 55, height: 55, border: '5px solid #303030', borderTop: '5px solid #8d6aff',
                    borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'
                  }} />
                </div>
              ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                  <div style={{ fontSize: 41, marginBottom: 18 }}>📹</div>
                  <p style={{ fontSize: 19, margin: 0 }}>Nenhum vídeo enviado ainda</p>
                  <button onClick={() => setActiveTab('upload')} style={{
                    marginTop: 18, padding: '10px 24px', background: '#8d6aff', color: '#fff',
                    border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 600, cursor: 'pointer'
                  }}>
                    Fazer primeiro upload
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
                  gap: 28
                }}>
                  {videos.map((v) => (
                    <div key={v.id}
                      style={{
                        background: "#20153e", borderRadius: 14, overflow: "hidden",
                        position: "relative", boxShadow: "0 4px 28px #18142355", paddingBottom: 6
                      }}>
                      {canDelete(v.user_id?.toString()) && (
                        <button onClick={() => deleteVideo(v.id, v.user_id)}
                          style={{
                            position: 'absolute', top: 8, right: 8, zIndex: 10,
                            background: 'rgba(0,0,0,0.8)', border: 'none',
                            borderRadius: '50%', width: 36, height: 36, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 18, color: '#fff',
                            transition: 'background 0.2s'
                          }}>🗑️
                        </button>
                      )}
                      <div style={{ width: "100%", aspectRatio: "16/9", background: "#130c23" }}>
                        <iframe
                          src={v.gdrive_id
                            ? `https://drive.google.com/file/d/${v.gdrive_id}/preview`
                            : (v.bunny_id
                              ? `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false`
                              : ""
                            )}
                          style={{ width: "100%", height: "100%", border: 'none', borderRadius: 7 }}
                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                          allowFullScreen />
                      </div>
                      <div style={{ padding: 14 }}>
                        <h3 style={{
                          margin: 0, fontSize: 18, fontWeight: 600, color: '#fff',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {v.title}
                        </h3>
                        <p style={{
                          margin: '9px 0 0', fontSize: 14, color: '#aaa'
                        }}>
                          Por {v.username || 'Anônimo'}
                        </p>
                        <div style={{ marginTop: 7, fontSize: 15, color: "#c2bcf7" }}>
                          💜 {v.likes || 0} • 👁️ {v.views || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <h2 style={{ fontSize: 25, fontWeight: 600, marginBottom: 24 }}>Enviar vídeo</h2>
              <div
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && droppedFile.type.startsWith('video/')) {
                    setFile(droppedFile);
                    showToast('Arquivo carregado!', 'success');
                  }
                }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                style={{
                  background: isDragging ? '#28225b' : '#181733', borderRadius: 14, padding: 36,
                  textAlign: 'center', border: isDragging ? '2.2px dashed #8d6aff' : '2.2px dashed #333',
                  transition: 'all 0.3s'
                }}>
                <div style={{ fontSize: 58, marginBottom: 24 }}>{isDragging ? '📥' : '☁️'}</div>
                <p style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>
                  {isDragging ? 'Solte o vídeo aqui!' : 'Arraste um vídeo ou clique para selecionar'}
                </p>
                <input type="file" accept="video/*"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) {
                      setFile(f);
                      showToast('Arquivo selecionado!', 'success');
                    }
                  }} style={{ display: 'none' }} id="file-input" />
                <label htmlFor="file-input" style={{
                  display: 'inline-block', padding: '12px 32px', background: '#8d6aff', color: '#fff',
                  borderRadius: 20, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8
                }}>
                  Selecionar arquivo
                </label>
                {file && (
                  <div style={{
                    marginTop: 30, padding: 16, background: '#211640', borderRadius: 9, textAlign: 'left'
                  }}>
                    <p style={{ margin: 0, fontSize: 15, color: '#aaa' }}>Arquivo selecionado:</p>
                    <p style={{ margin: '5px 0 0', fontSize: 16, fontWeight: 600 }}>{file.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#ac98f8' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <button onClick={upload} disabled={!file || progress > 0} style={{
                  marginTop: 32, padding: '12px 48px',
                  background: !file || progress > 0 ? '#55535c' : '#8d6aff',
                  color: '#fff', border: 'none', borderRadius: 20, fontSize: 17, fontWeight: 600,
                  cursor: !file || progress > 0 ? 'not-allowed' : 'pointer', display: 'block', width: '100%'
                }}>
                  {progress > 0 && progress < 100 ? `Enviando... ${progress}%` : 'Publicar vídeo'}
                </button>
                {progress > 0 && progress < 100 && (
                  <div style={{ marginTop: 19 }}>
                    <div style={{ width: '100%', height: 8, background: '#303030', borderRadius: 3 }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: '#8d6aff', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer style={{
          background: "linear-gradient(90deg, #18142a 70%, #3b2ba4 100%)",
          color: "#fff",
          fontSize: 15,
          padding: "26px 0",
          borderTop: "2px solid #8d6aff",
          marginTop: 20
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", display: "flex",
            justifyContent: "space-between", gap: 30, flexWrap: "wrap"
          }}>
            <div>
              <h3 style={{ color: "#8d6aff", fontWeight: 900 }}>SINOPINHAS</h3>
              <p>
                Plataforma de streaming social. <br />Poste, comente e reaja!
              </p>
            </div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li><a href="/faq" style={{ color: "#fff" }}>FAQ</a></li>
              <li><a href="/regras" style={{ color: "#fff" }}>Regras</a></li>
              <li><a href="/perfil" style={{ color: "#fff" }}>Meu Perfil</a></li>
              <li><a href="/contato" style={{ color: "#fff" }}>Sugestões</a></li>
            </ul>
            <div>
              <p><b>Aviso:</b> Atividade rastreada. Não colaboramos com crimes. Denúncias serão apuradas conforme a lei.</p>
              <p style={{ fontSize: 14, color: "#aaa" }}>SINOPINHAS® 2025</p>
            </div>
          </div>
        </footer>
        <style jsx>{`
          @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
