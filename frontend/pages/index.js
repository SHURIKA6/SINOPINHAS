import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";

// Defina a URL do seu backend no .env.local:
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  // --- ESTADOS DE CONTEÚDO RESTRITO ---
  const [secretPassword, setSecretPassword] = useState('');
  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false); // Controla a exibição da aba secreta
  // --- 1. TODOS OS ESTADOS (VARIÁVEIS) ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estados de Interface
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Estados de Auth
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Estados de Dados
  const [videos, setVideos] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [logs, setLogs] = useState([]); 
  
  // Estados de Upload
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de Comentários
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoComments, setVideoComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // --- 2. EFEITOS (CARREGAMENTO) ---
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdminPassword) {
      setAdminPassword(savedAdminPassword);
      setIsAdmin(true);
    }
    loadVideos();
  }, []);

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      loadUsers();
      fetchLogs();
    }
  }, [activeTab, isAdmin]);

  // --- 3. FUNÇÕES GERAIS ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/videos`);
      setVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canDelete = (ownerId) => isAdmin || (user && user.id.toString() === ownerId);

  // --- 4. FUNÇÕES DE COMENTÁRIOS ---
  const openComments = async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    try {
      const res = await axios.get(`${API}/api/comments/${video.id}`);
      setVideoComments(res.data);
    } catch (err) { console.error(err); }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!user) return showToast('Faça login para comentar', 'error');
    if (!newComment.trim()) return;

    try {
      await axios.post(`${API}/api/comment`, {
        video_id: currentVideo.id,
        user_id: user.id,
        comment: newComment
      });
      setNewComment(""); 
      const res = await axios.get(`${API}/api/comments/${currentVideo.id}`);
      setVideoComments(res.data);
      showToast('Comentário enviado!', 'success');
    } catch (err) {
      showToast('Erro ao comentar', 'error');
    }
  };

  // --- 5. FUNÇÕES DE ADMIN ---
  const loadUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/users?admin_password=${adminPassword}`);
      setUsersList(res.data);
    } catch (err) { showToast('Erro ao carregar usuários', 'error'); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/logs?admin_password=${adminPassword}`);
      setLogs(res.data);
    } catch (err) { showToast('Erro ao buscar registros', 'error'); }
  };

  const resetPassword = async (userId) => {
    if(!confirm('Resetar a senha deste usuário para "123456"?')) return;
    try {
      await axios.post(`${API}/api/admin/reset-password`, { user_id: userId, admin_password: adminPassword });
      showToast('Senha alterada para 123456', 'success');
    } catch (err) { showToast('Erro ao resetar', 'error'); }
  };

  const banUser = async (userId) => {
    if(!confirm('TEM CERTEZA? Isso apaga o usuário e TODOS os vídeos dele!')) return;
    try {
      await axios.delete(`${API}/api/admin/users/${userId}`, { data: { admin_password: adminPassword } });
      showToast('Usuário banido/apagado!', 'success');
      loadUsers(); 
      loadVideos(); 
    } catch (err) { showToast('Erro ao banir', 'error'); }
  };

  // --- 6. AUTENTICAÇÃO E UPLOAD ---
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!username || !password) return showToast('Preencha todos os campos', 'error');
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(`${API}${endpoint}`, { username, password });
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
      const res = await axios.post(`${API}/api/admin/login`, { password: adminPassword });
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

  const handleSecretAuth = (e) => {
    e.preventDefault();
    if (secretPassword === '0000') {
      setShowSecretAuth(false);
      setShowSecretTab(true);
      setActiveTab('secret');
      setSecretPassword('');
      showToast('Acesso liberado!', 'success');
    } else {
      showToast('Senha Incorreta.', 'error');
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
      await axios.post(`${API}/api/upload`, form, {
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
      await axios.delete(`${API}/api/videos/${videoId}`, { data: deleteData });
      showToast('Vídeo deletado!', 'success');
      await loadVideos();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao deletar', 'error');
    }
  };

  // --- 7. RENDERIZAÇÃO (VISUAL) ---
  return (
    <>
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <meta name="theme-color" content="#18142a" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #18142a 80%, #8d6aff 100%)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* TOAST */}
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff', padding: '16px 24px', borderRadius: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
              <span style={{ fontWeight: 500 }}>{toast.message}</span>
            </div>
          </div>
        )}

        {/* LOGIN MODAL */}
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
                  value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff' }}
                />
                <input
                  type="password" placeholder="Senha"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff' }}
                />
                <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, marginBottom: 16, cursor:'pointer', fontWeight:600 }}>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
                <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: 12, background: 'none', color: '#aaa', border: 'none', cursor: 'pointer' }}>
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN LOGIN MODAL */}
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
                  value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff' }}
                />
                <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight:600 }}>
                  Entrar como Admin
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header style={{
          background: '#212121', padding: '16px 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #303030'
        }}>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            letterSpacing: "2px", background: "linear-gradient(90deg,#8d6aff,#fe7d45 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>SINOPINHAS</h1>
          {/* Adicione este botão junto dos outros do Header (Logo antes do botão Admin) */}
<button onClick={() => setShowSecretAuth(true)} style={{
  padding: '7px 16px', background: '#e53e3e', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer'
}}>
  Conteúdo Restrito
</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            {isAdmin && (
              <span style={{ padding: '6px 12px', background: '#10b981', borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                ADMIN
              </span>
            )}
            {user ? (
              <>
                <span style={{ fontSize: 16, color: '#aaa' }}><strong style={{ color: '#fff' }}>{user.username}</strong></span>
                <button onClick={logout} style={{ padding: '7px 16px', background: '#303030', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sair</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ padding: '7px 16px', background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Login</button>
            )}
            {!isAdmin ? (
              <button onClick={() => setShowAdminAuth(true)} style={{ padding: '7px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Admin</button>
            ) : (
              <button onClick={logoutAdmin} style={{ padding: '7px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sair Admin</button>
            )}
          </div>
        </header>

        {/* TABS */}
        <div style={{ background: '#212121', padding: '0 24px', display: 'flex', gap: 24, borderBottom: '2px solid #303030' }}>
          {['videos', 'upload', isAdmin ? 'admin' : null, showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
  <button key={tab} onClick={() => setActiveTab(tab)} style={{
    // ... (mantenha os estilos) ...
  }}>
    {/* AJUSTE DO NOME DA ABA */}
    {tab === 'videos' ? 'Vídeos' : tab === 'upload' ? 'Upload' : tab === 'admin' ? 'Admin' : 'Mesma Senha da Sky'} 
  </button>
))}
        </div>

        {/* CONTENT */}
        <div style={{ padding: 38, maxWidth: 1160, margin: '0 auto' }}>
          
          {/* TAB VÍDEOS */}
          {activeTab === 'videos' && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
                {loading ? 'Carregando...' : `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`}
              </h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{ width: 55, height: 55, border: '5px solid #303030', borderTop: '5px solid #8d6aff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : videos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                  <div style={{ fontSize: 41, marginBottom: 18 }}>📹</div>
                  <p style={{ fontSize: 19, margin: 0 }}>Nenhum vídeo enviado ainda</p>
                  <button onClick={() => setActiveTab('upload')} style={{ marginTop: 18, padding: '10px 24px', background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}>
                    Fazer primeiro upload
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                  {videos.map((v) => (
                    <div key={v.id} style={{ background: "#20153e", borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 4px 28px #18142355", paddingBottom: 6 }}>
                      {canDelete(v.user_id?.toString()) && (
                        <button onClick={() => deleteVideo(v.id, v.user_id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff' }}>🗑️</button>
                      )}
                      <div style={{ width: "100%", aspectRatio: "16/9", background: "#130c23" }}>
                        <iframe
                          src={v.gdrive_id ? `https://drive.google.com/file/d/${v.gdrive_id}/preview` : (v.bunny_id ? `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false` : "")}
                          style={{ width: "100%", height: "100%", border: 'none', borderRadius: 7 }}
                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowFullScreen />
                      </div>
                      <div style={{ padding: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</h3>
                        <p style={{ margin: '9px 0 0', fontSize: 14, color: '#aaa' }}>Por {v.username || 'Anônimo'}</p>
                        <div style={{ marginTop: 7, fontSize: 15, color: "#c2bcf7" }}>💜 {v.likes || 0} • 👁️ {v.views || 0}</div>
                        
                        {/* BOTÃO COMENTÁRIOS */}
                        <button onClick={() => openComments(v)} style={{
                           marginTop: 12, width:'100%', padding:'8px', background:'#352f5b', 
                           color:'#fff', border:'none', borderRadius:6, cursor:'pointer'
                        }}>
                          💬 Ver Comentários
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB UPLOAD */}
          {activeTab === 'upload' && (
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <h2 style={{ fontSize: 25, fontWeight: 600, marginBottom: 24 }}>Enviar vídeo</h2>
              <div
                onDrop={e => {
                  e.preventDefault(); setIsDragging(false);
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && droppedFile.type.startsWith('video/')) {
                    setFile(droppedFile); showToast('Arquivo carregado!', 'success');
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
                <p style={{ fontSize: 19, fontWeight: 600, marginBottom: 8 }}>{isDragging ? 'Solte o vídeo aqui!' : 'Arraste um vídeo ou clique para selecionar'}</p>
                <input type="file" accept="video/*" onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); showToast('Arquivo selecionado!', 'success'); } }} style={{ display: 'none' }} id="file-input" />
                <label htmlFor="file-input" style={{ display: 'inline-block', padding: '12px 32px', background: '#8d6aff', color: '#fff', borderRadius: 20, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Selecionar arquivo</label>
                {file && (
                  <div style={{ marginTop: 30, padding: 16, background: '#211640', borderRadius: 9, textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: 15, color: '#aaa' }}>Arquivo selecionado:</p>
                    <p style={{ margin: '5px 0 0', fontSize: 16, fontWeight: 600 }}>{file.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: '#ac98f8' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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

          {/* TAB ADMIN (LOGS E USUÁRIOS) */}
          {activeTab === 'admin' && isAdmin && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ marginBottom: 20 }}>👮‍♂️ Painel de Controle</h2>
              
              {/* LISTA DE USUÁRIOS */}
              <div style={{ background: '#20153e', padding: 20, borderRadius: 12, marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                   <h3 style={{ margin:0 }}>👥 Gerenciar Usuários</h3>
                   <button onClick={loadUsers} style={{ cursor:'pointer', padding:'4px 10px'}}>Atualizar</button>
                </div>
                <div style={{maxHeight: 300, overflowY: 'auto'}}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{textAlign:'left', color:'#aaa', borderBottom: '1px solid #444'}}>
                        <th style={{padding:10}}>ID</th>
                        <th>Usuário</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(u => (
                        <tr key={u.id} style={{borderTop:'1px solid #333'}}>
                          <td style={{padding:10, color:'#666'}}>#{u.id}</td>
                          <td style={{fontWeight:'bold'}}>{u.username}</td>
                          <td>
                            <button onClick={() => resetPassword(u.id)} style={{ marginRight: 10, background:'#eab308', border:'none', padding:'4px 10px', borderRadius:4, cursor:'pointer', color:'#000' }}>🔑 Resetar</button>
                            <button onClick={() => banUser(u.id)} style={{ background:'#ef4444', border:'none', padding:'4px 10px', borderRadius:4, cursor:'pointer', color:'#fff' }}>🚫 Banir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LISTA DE LOGS */}
              <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12 }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                  <h3 style={{color:'#fff', margin:0}}>📜 Central de Inteligência (Logs)</h3>
                  <button onClick={fetchLogs} style={{padding:'8px 16px', cursor:'pointer'}}>Atualizar</button>
                </div>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', color:'#ccc', fontSize: 14}}>
                    <thead>
                      <tr style={{background:'#333', color:'#fff', textAlign:'left'}}>
                        <th style={{padding:10}}>Data/Hora</th>
                        <th style={{padding:10}}>Usuário</th>
                        <th style={{padding:10}}>IP</th>
                        <th style={{padding:10}}>Ação</th>
                        <th style={{padding:10}}>Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{borderBottom:'1px solid #444'}}>
                          <td style={{padding:10}}>{new Date(log.created_at).toLocaleString()}</td>
                          <td style={{padding:10, fontWeight:'bold', color: log.username ? '#8d6aff' : '#aaa'}}>{log.username || 'Anônimo'}</td>
                          <td style={{padding:10, color:'#ff6f4e', fontFamily:'monospace'}}>{log.ip}</td>
                          <td style={{padding:10}}>{log.action}</td>
                          <td style={{padding:10, maxWidth: 300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* --- MODAL DE COMENTÁRIOS --- */}
        {showCommentsModal && currentVideo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex',
            justifyContent: 'center', alignItems: 'center'
          }} onClick={() => setShowCommentsModal(false)}>
            
            <div style={{
              background: '#1a1a1a', width: '90%', maxWidth: 600, maxHeight: '80vh',
              borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              
              {/* Cabeçalho do Modal */}
              <div style={{ padding: 16, borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between' }}>
                <h3 style={{ margin: 0 }}>Comentários: {currentVideo.title}</h3>
                <button onClick={() => setShowCommentsModal(false)} style={{background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer'}}>✕</button>
              </div>

              {/* Lista de Comentários (Rolagem) */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {videoComments.length === 0 ? (
                  <p style={{ color: '#aaa', textAlign: 'center' }}>Seja o primeiro a comentar!</p>
                ) : (
                  videoComments.map((c, i) => (
                    <div key={i} style={{ marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                        <span style={{ fontWeight: 'bold', color: '#8d6aff' }}>{c.username || 'Anônimo'}</span>
                        <span style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: 0, color: '#ddd' }}>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Campo de Digitar */}
              <form onSubmit={sendComment} style={{ padding: 16, background: '#222', borderTop: '1px solid #333', display: 'flex', gap: 10 }}>
                <input 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Escreva algo legal..."
                  style={{ flex: 1, padding: 10, borderRadius: 20, border: 'none', background: '#333', color: '#fff' }}
                />
                <button type="submit" style={{ background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 20, padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Enviar
                </button>
              </form>
            </div>
          </div>
        )}
        
      </div>
      {/* --- MODAL DE SENHA SECRETA (No final, antes do último </div>) --- */}
{showSecretAuth && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  }} onClick={() => setShowSecretAuth(false)}>
    <div style={{
      background: '#1a1a1a', borderRadius: 12, padding: 32,
      maxWidth: 400, width: '90%'
    }} onClick={e => e.stopPropagation()}>
      <h2 style={{ margin: '0 0 24px' }}>🔒 Mesma Senha da Sky</h2>
      <form onSubmit={handleSecretAuth}>
        <input
          type="password" placeholder="Digite a senha (0000)"
          value={secretPassword}
          onChange={e => setSecretPassword(e.target.value)}
          style={{
            width: '100%', padding: 12, marginBottom: 16,
            background: '#0f0f0f', border: '1px solid #303030',
            borderRadius: 8, color: '#fff', fontSize: 15
          }}
        />
        <button type="submit" style={{
          width: '100%', padding: 12, background: '#e53e3e',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 15, fontWeight: 600, cursor: 'pointer'
        }}>
          Liberar Acesso
        </button>
      </form>
    </div>
  </div>
)}
{/* --- ABA DE CONTEÚDO RESTRITO (No bloco de conteúdo principal) --- */}
{activeTab === 'secret' && showSecretTab && (
  <div style={{ padding: 38, maxWidth: 1160, margin: '0 auto' }}>
    <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>Conteúdo Restrito (Secret Videos)</h2>
    <div style={{ textAlign: 'center', padding: 64, background: '#303030', borderRadius: 16, color: '#fff' }}>
        <p style={{ fontSize: 20 }}>Coloque aqui o seu código de vídeos secretos.</p>
        <p style={{ fontSize: 14, color: '#aaa' }}>Você pode usar o mesmo layout da aba "Vídeos" para listar os vídeos específicos desta aba.</p>
    </div>
  </div>
)}
    </>
  );
}