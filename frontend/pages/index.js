import Inbox from './inbox';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";

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
      showToast(err.response?.data?.error || 'Erro ao comentar', 'error');
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
    } catch (err) { showToast(err.response?.data?.error || 'Erro ao banir', 'error'); }
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
    <div className={styles.container}> {/* Aplica o estilo de fundo e texto principal */}
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <meta name="theme-color" content="#18142a" />
      </Head>

        
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
              <h2 style={{ margin: '0 0 24px' }}>🔒 VÍDEOS SAPECAS</h2>
              <form onSubmit={handleSecretAuth}>
                <input
                  type="password" placeholder="MESMA SENHA DA SKY"
                  value={secretPassword}
                  onChange={e => setSecretPassword(e.target.value)}
                  style={{
                    width: '100%', padding: 12, marginBottom: 16,
                    background: '#0f0f0f', border: '1px solid #303030',
                    borderRadius: 8, color: '#fff', fontSize: 15
                  }}
                />
                <button type="submit" style={{ //teste//
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

        <header className={styles.header}>
          <h1 className={styles.title}>SINOPINHAS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <button onClick={() => setShowSecretAuth(true)} className={styles.tab} style={{ color: '#e53e3e', border: 'none' }}>
              Conteúdo Restrito
            </button>
            {isAdmin && (
              <span style={{ padding: '6px 12px', background: '#10b981', borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                ADMIN
              </span>
            )}
            {user ? (
              <>
                <span style={{ fontSize: 16, color: '#aaa' }}><strong style={{ color: '#fff' }}>{user.username}</strong></span>
                <button onClick={logout} className={styles.tab}>Sair</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className={styles.tab} style={{ background: '#8d6aff', color: '#fff', border: 'none' }}>Login</button>
            )}
            {!isAdmin ? (
              <button onClick={() => setShowAdminAuth(true)} className={styles.tab} style={{ background: '#10b981', color: '#fff', border: 'none' }}>Admin</button>
            ) : (
              <button onClick={logoutAdmin} className={styles.tab} style={{ background: '#ef4444', color: '#fff', border: 'none' }}>Sair Admin</button>
            )}
          </div>
        </header>


        <div className={styles.tabs}>
          {['videos', 'upload', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? styles.tabActive : styles.tab}>
              {tab === 'videos' ? 'Vídeos' : tab === 'upload' ? 'Upload' : tab === 'admin' ? 'Admin' : tab === 'inbox' ? 'Mensagens' : 'SAFADEZA'}
            </button>
          ))}
        </div>


        <div className={styles.content}>
          

          {activeTab === 'videos' && (
            <div>
              <h2 className={styles.sectionTitle}>
                {loading ? 'Carregando...' : `${videos.length} vídeo${videos.length !== 1 ? 's' : ''}`}
              </h2>
              {loading ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔄</div>
                  <p className={styles.emptyText}>Carregando vídeos...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📹</div>
                  <p className={styles.emptyText}>Nenhum vídeo enviado ainda</p>
                  <button onClick={() => setActiveTab('upload')} className={styles.emptyButton}>
                    Fazer primeiro upload
                  </button>
                </div>
              ) : (
                <div className={styles.videoGrid}>
                  {videos.map((v) => (
                    <div key={v.id} className={styles.videoCard}>
                      {canDelete(v.user_id?.toString()) && (
                        <button onClick={() => deleteVideo(v.id, v.user_id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff' }}>🗑️</button>
                      )}
                      <div className={styles.videoIframe}>
                        <iframe
                          src={v.gdrive_id ? `https://drive.google.com/file/d/${v.gdrive_id}/preview` : (v.bunny_id ? `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false` : "")}
                          style={{ width: "100%", height: "100%", border: 'none', borderRadius: 7 }}
                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowFullScreen />
                      </div>
                      <div className={styles.videoInfo}>
                        <h3 className={styles.videoTitle}>{v.title}</h3>
                        <p className={styles.videoViews}>Por {v.username || 'Anônimo'}</p>
                        <div style={{ marginTop: 7, fontSize: 15, color: "#c2bcf7" }}>💜 {v.likes || 0} • 👁️ {v.views || 0}</div>
                        

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


          {activeTab === 'upload' && (
            <div className={styles.uploadContainer}>
              <h2 className={styles.sectionTitle}>Enviar vídeo</h2>
              <div className={styles.uploadBox}>
                <div className={styles.uploadIcon}>{isDragging ? '📥' : '☁️'}</div>
                <p className={styles.emptyText}>{isDragging ? 'Solte o vídeo aqui!' : 'Arraste um vídeo ou clique para selecionar'}</p>
                <input type="file" accept="video/*" onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); showToast('Arquivo selecionado!', 'success'); } }} style={{ display: 'none' }} id="file-input" />
                <label htmlFor="file-input" className={styles.selectButton}>Selecionar arquivo</label>
                {file && (
                  <div className={styles.filePreview}>
                    <p className={styles.fileLabel}>Arquivo selecionado:</p>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
                <button onClick={upload} disabled={!file || progress > 0} className={styles.uploadButton}>
                  {progress > 0 && progress < 100 ? `Enviando... ${progress}%` : 'Publicar vídeo'}
                </button>
                {progress > 0 && progress < 100 && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {activeTab === 'admin' && isAdmin && (
            <div className={styles.content}>
              <h2 className={styles.sectionTitle}>👮‍♂️ Painel de Controle</h2>


              <div className={styles.adminSection}>
                <div className={styles.adminHeader}>
                  <h3 className={styles.adminSubtitle}>👥 Gerenciar Usuários</h3>
                  <button onClick={loadUsers} className={styles.adminButton}>Atualizar</button>
                </div>
                <div className={styles.userList}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr className={styles.adminTableRow}>
                        <th>ID</th>
                        <th>Usuário</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map(u => (
                        <tr key={u.id} className={styles.adminTableRow}>
                          <td>#{u.id}</td>
                          <td>{u.username}</td>
                          <td>
                            <button onClick={() => resetPassword(u.id)} className={styles.resetButton}>🔑 Resetar</button>
                            <button onClick={() => banUser(u.id)} className={styles.banButton}>🚫 Banir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>


              <div className={styles.adminSection}>
                <div className={styles.adminHeader}>
                  <h3 className={styles.adminSubtitle}>📜 Central de Inteligência (Logs)</h3>
                  <button onClick={fetchLogs} className={styles.adminButton}>Atualizar</button>
                </div>
                <div className={styles.logList}>

                <table className={styles.adminTable}>
                    <thead>
                      <tr className={styles.adminTableRow}>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Dispositivo</th>
                        <th>IP</th>
                        <th>Ação</th>
                        <th>Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} className={styles.adminTableRow}>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                          <td>{log.username || 'Anônimo'}</td>
                          <td>{log.device_type || 'N/A'}</td>
                          <td>{log.ip}</td>
                          <td>{log.action}</td>
                          <td>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'inbox' && user && (
            <Inbox user={user} usersList={usersList} />
          )}
// ...existing code...
{activeTab === 'secret' && showSecretTab && (
    <div style={{ padding: 38, maxWidth: 1160, margin: '0 auto' }}>
      <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
        Conteúdo Restrito (Secret Videos)
      </h2>
      <div
        style={{
          textAlign: 'center',
          padding: 64,
          background: '#303030',
          borderRadius: 16,
          color: '#fff'
        }}
      >
        <p style={{ fontSize: 20 }}>
          Coloque aqui o seu código de vídeos secretos.
        </p>
        <p style={{ fontSize: 14, color: '#aaa' }}>
          Você pode usar o mesmo layout da aba "Vídeos" para listar os vídeos específicos desta aba.
        </p>
      </div>
    </div>
)}
// ...existing code...
        
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
              
              
              <div style={{ padding: 16, borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between' }}>
                <h3 style={{ margin: 0 }}>Comentários: {currentVideo.title}</h3>
                <button onClick={() => setShowCommentsModal(false)} style={{background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer'}}>✕</button>
              </div>


              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {videoComments.length === 0 ? (
                  <p className={styles.emptyText}>Seja o primeiro a comentar!</p>
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
    </div>
  );
}