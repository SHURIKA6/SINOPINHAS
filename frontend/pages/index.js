import Inbox from '../components/inbox';
import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";
import { sendFingerprint } from '../lib/fingerprint';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [secretPassword, setSecretPassword] = useState('');
  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [videos, setVideos] = useState([]);
  const [secretVideos, setSecretVideos] = useState([]);
  const [usersList, setUsersList] = useState([]); 
  const [logs, setLogs] = useState([]); 
  
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoComments, setVideoComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newBio, setNewBio] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setNewAvatar(u.avatar || '');
      setNewBio(u.bio || '');
      loadNotifications(u.id);
    }
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

  useEffect(() => {
    if (activeTab === 'secret' && showSecretTab) {
      loadSecretVideos();
    }
  }, [activeTab, showSecretTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadNotifications = async (userId) => {
    try {
      const res = await axios.get(`${API}/api/notifications/${userId}`);
      const unread = res.data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/videos${user ? `?user_id=${user.id}` : ''}`);
      setVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSecretVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/secret-videos${user ? `?user_id=${user.id}` : ''}`);
      setSecretVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos restritos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canDelete = (ownerId) => isAdmin || (user && user.id.toString() === ownerId);

  const toggleLike = async (videoId) => {
    if (!user) return showToast('Faça login para curtir', 'error');
    try {
      await axios.post(`${API}/api/videos/${videoId}/like`, { user_id: user.id });
      await loadVideos();
      if (activeTab === 'secret') await loadSecretVideos();
    } catch (err) {
      showToast('Erro ao curtir vídeo', 'error');
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const updates = {};
      if (newPassword) updates.password = newPassword;
      if (newAvatar !== user.avatar) updates.avatar = newAvatar;
      if (newBio !== user.bio) updates.bio = newBio;

      if (Object.keys(updates).length === 0) {
        return showToast('Nenhuma alteração feita', 'error');
      }

      const res = await axios.put(`${API}/api/users/${user.id}`, updates);
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNewPassword('');
      setShowProfile(false);
      showToast('Perfil atualizado!', 'success');
    } catch (err) {
      showToast('Erro ao atualizar perfil', 'error');
    }
  };

  const openComments = async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    try {
      const res = await axios.get(`${API}/api/comments/${video.id}`);
      setVideoComments(res.data);
      
      if (user) {
        await axios.post(`${API}/api/videos/${video.id}/view`, { user_id: user.id });
      }
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

  const deleteComment = async (commentId) => {
    if (!confirm('Deletar este comentário?')) return;
    try {
      await axios.delete(`${API}/api/comments/${commentId}`, { 
        data: { user_id: user.id, admin_password: isAdmin ? adminPassword : null } 
      });
      const res = await axios.get(`${API}/api/comments/${currentVideo.id}`);
      setVideoComments(res.data);
      showToast('Comentário deletado!', 'success');
    } catch (err) {
      showToast('Erro ao deletar comentário', 'error');
    }
  };

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

  const handleAuth = async (e) => {
  e.preventDefault();
  if (!username || !password) return showToast('Preencha todos os campos', 'error');
  try {
    // Capturar fingerprint
    const fingerprintData = await sendFingerprint('AUTH');
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const res = await axios.post(`${API}${endpoint}`, { 
      username, 
      password,
      ...fingerprintData // Enviar fingerprint junto
    });
    
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setShowAuth(false);
    setUsername('');
    setPassword('');
    setNewAvatar(res.data.user.avatar || '');
    setNewBio(res.data.user.bio || '');
    showToast(isLogin ? 'Login realizado!' : 'Conta criada!', 'success');
    if (res.data.user.id) loadNotifications(res.data.user.id);
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
    setUnreadCount(0);
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
      await loadSecretVideos();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao deletar', 'error');
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSecretVideos = secretVideos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortVideos = (videoList) => {
    const sorted = [...videoList];
    switch(sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'popular':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'liked':
        return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return sorted;
    }
  };

  const sortedVideos = sortVideos(filteredVideos);
  const sortedSecretVideos = sortVideos(filteredSecretVideos);

  return (
    <>
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18142a" />
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
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} onClick={() => setShowAuth(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '100%'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px' }}>{isLogin ? 'Login' : 'Criar Conta'}</h2>
              <form onSubmit={handleAuth}>
                <input
                  type="text" placeholder="Username"
                  value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                />
                <input
                  type="password" placeholder="Senha"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                />
                <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, marginBottom: 16, cursor:'pointer', fontWeight:600, fontSize: 16 }}>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
                <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: 12, background: 'none', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showProfile && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} onClick={() => setShowProfile(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '100%'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px' }}>✏️ Editar Perfil</h2>
              <form onSubmit={updateProfile}>
                <input
                  type="text" placeholder="URL do Avatar"
                  value={newAvatar} onChange={e => setNewAvatar(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                />
                <textarea
                  placeholder="Bio"
                  value={newBio} onChange={e => setNewBio(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', resize: 'vertical', fontSize: 16 }}
                />
                <input
                  type="password" placeholder="Nova Senha (deixe vazio para não alterar)"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                />
                <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, cursor:'pointer', fontWeight:600, fontSize: 16 }}>
                  Salvar Alterações
                </button>
              </form>
            </div>
          </div>
        )}

        {showAdminAuth && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} onClick={() => setShowAdminAuth(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '100%'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px' }}>🔒 Acesso Admin</h2>
              <form onSubmit={handleAdminLogin}>
                <input
                  type="password" placeholder="Senha de admin"
                  value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  style={{ width: '100%', padding: 12, marginBottom: 16, background: '#0f0f0f', border: '1px solid #303030', borderRadius: 8, color: '#fff', fontSize: 16 }}
                />
                <button type="submit" style={{ width: '100%', padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight:600, fontSize: 16 }}>
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
            alignItems: 'center', justifyContent: 'center', padding: '20px'
          }} onClick={() => setShowSecretAuth(false)}>
            <div style={{
              background: '#1a1a1a', borderRadius: 12, padding: 32,
              maxWidth: 400, width: '100%'
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
                    borderRadius: 8, color: '#fff', fontSize: 16
                  }}
                />
                <button type="submit" style={{
                  width: '100%', padding: 12, background: '#e53e3e',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 16, fontWeight: 600, cursor: 'pointer'
                }}>
                  Liberar Acesso
                </button>
              </form>
            </div>
          </div>
        )}

        <header style={{
  background: '#212121', 
  padding: '16px 24px', 
  display: 'flex',
  alignItems: 'center', 
  justifyContent: 'space-between', 
  borderBottom: '2px solid #303030',
  flexWrap: 'wrap',
  gap: '12px',
  position: 'relative'
}}>
  <h1 style={{
    margin: 0, 
    fontSize: 28, 
    fontWeight: 700,
    letterSpacing: "2px", 
    background: "linear-gradient(90deg,#8d6aff,#fe7d45 60%)",
    WebkitBackgroundClip: "text", 
    WebkitTextFillColor: "transparent",
    minWidth: '180px',
    flexShrink: 0
  }}>SINOPINHAS</h1>
  
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1
  }}>
    <button onClick={() => setShowSecretAuth(true)} style={{
      padding: '7px 12px', 
      background: '#e53e3e', 
      color: '#fff',
      border: 'none', 
      borderRadius: 8, 
      fontSize: 13, 
      fontWeight: 600, 
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}>
      🔒 Restrito
    </button>
    
    {isAdmin && (
      <span style={{ 
        padding: '5px 10px', 
        background: '#10b981', 
        borderRadius: 8, 
        fontSize: 11, 
        fontWeight: 600, 
        color: "#fff",
        flexShrink: 0
      }}>
        ADMIN
      </span>
    )}
    
    {user ? (
      <>
        <button onClick={() => setShowProfile(true)} style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          padding: '6px 10px', 
          background: '#303030', 
          border: 'none',
          borderRadius: 8, 
          cursor: 'pointer', 
          color: '#fff',
          whiteSpace: 'nowrap',
          maxWidth: '120px',
          flexShrink: 0
        }}>
          {user.avatar && (
            <img 
              src={user.avatar} 
              style={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }} 
              alt={user.username}
            />
          )}
          <strong style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 13
          }}>{user.username}</strong>
        </button>
        
        <button onClick={logout} style={{ 
          padding: '7px 12px', 
          background: '#303030', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 8, 
          cursor: 'pointer',
          fontSize: 13,
          flexShrink: 0
        }}>Sair</button>
      </>
    ) : (
      <button onClick={() => setShowAuth(true)} style={{ 
        padding: '7px 14px', 
        background: '#8d6aff', 
        color: '#fff', 
        border: 'none', 
        borderRadius: 8, 
        fontWeight: 600, 
        cursor: 'pointer',
        fontSize: 13,
        flexShrink: 0
      }}>Login</button>
    )}
    
    {!isAdmin ? (
      <button onClick={() => setShowAdminAuth(true)} style={{ 
        padding: '7px 12px', 
        background: '#10b981', 
        color: '#fff', 
        border: 'none', 
        borderRadius: 8, 
        fontWeight: 600, 
        cursor: 'pointer',
        fontSize: 13,
        flexShrink: 0
      }}>Admin</button>
    ) : (
      <button onClick={logoutAdmin} style={{ 
        padding: '7px 12px', 
        background: '#ef4444', 
        color: '#fff', 
        border: 'none', 
        borderRadius: 8, 
        cursor: 'pointer',
        fontSize: 13,
        flexShrink: 0
      }}>Sair Admin</button>
    )}
  </div>
</header>


        <div style={{ background: '#212121', padding: '0 24px', display: 'flex', gap: 24, borderBottom: '2px solid #303030', overflowX: 'auto' }}>
          {['videos', 'upload', isAdmin ? 'admin' : null, 'inbox', showSecretTab ? 'secret' : null].filter(Boolean).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '14px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '3px solid #8d6aff' : '3px solid transparent',
              color: activeTab === tab ? '#fff' : '#aaa', fontSize: 16,
              fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
              transition: 'all 0.3s', position: 'relative', whiteSpace: 'nowrap'
            }}>
              {tab === 'videos' ? 'Vídeos' : tab === 'upload' ? 'Upload' : tab === 'admin' ? 'Admin' : tab === 'inbox' ? (
                <>
                  Mensagens
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      background: '#ef4444', borderRadius: '50%',
                      width: 20, height: 20, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 'bold'
                    }}>{unreadCount}</span>
                  )}
                </>
              ) : 'SAFADEZA'}
            </button>
          ))}
        </div>

        <div style={{ padding: 38, maxWidth: 1160, margin: '0 auto' }}>
          
          {(activeTab === 'videos' || activeTab === 'secret') && (
            <div style={{ marginBottom: 20, display: 'flex', gap: 15, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Buscar vídeos por título ou autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px 20px',
                  background: '#1a1a1a',
                  border: '1px solid #303030',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 16
                }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '12px 20px',
                  background: '#1a1a1a',
                  border: '1px solid #303030',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                  minWidth: '150px'
                }}
              >
                <option value="recent">📅 Mais Recentes</option>
                <option value="popular">🔥 Mais Visualizados</option>
                <option value="liked">❤️ Mais Curtidos</option>
              </select>
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20 }}>
                {loading ? 'Carregando...' : `${sortedVideos.length} vídeo${sortedVideos.length !== 1 ? 's' : ''}`}
              </h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{ width: 55, height: 55, border: '5px solid #303030', borderTop: '5px solid #8d6aff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : sortedVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                  <div style={{ fontSize: 41, marginBottom: 18 }}>📹</div>
                  <p style={{ fontSize: 19, margin: 0 }}>Nenhum vídeo encontrado</p>
                  <button onClick={() => setActiveTab('upload')} style={{ marginTop: 18, padding: '10px 24px', background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer' }}>
                    Fazer primeiro upload
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                  {sortedVideos.map((v) => (
                    <div key={v.id} style={{ background: "#20153e", borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 4px 28px #18142355", paddingBottom: 6 }}>
                      {canDelete(v.user_id?.toString()) && (
                        <button onClick={() => deleteVideo(v.id, v.user_id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff' }}>🗑️</button>
                      )}
                      <div style={{ width: "100%", aspectRatio: "16/9", background: "#130c23", position: 'relative' }}>
                        {v.thumbnail_url && (
                          <img 
                            src={v.thumbnail_url} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }} 
                            alt={v.title}
                          />
                        )}
                        <iframe
                          src={v.gdrive_id ? `https://drive.google.com/file/d/${v.gdrive_id}/preview` : (v.bunny_id ? `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false` : "")}
                          style={{ width: "100%", height: "100%", border: 'none', borderRadius: 7, position: 'relative', zIndex: 1 }}
                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowFullScreen />
                      </div>
                      <div style={{ padding: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</h3>
                        <p style={{ margin: '9px 0 0', fontSize: 14, color: '#aaa' }}>Por {v.username || 'Anônimo'}</p>
                        <div style={{ marginTop: 7, fontSize: 15, color: "#c2bcf7", display: 'flex', gap: 15 }}>
                          <button onClick={() => toggleLike(v.id)} style={{ background: 'none', border: 'none', color: v.user_liked ? '#ff6b9d' : '#c2bcf7', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {v.user_liked ? '❤️' : '🤍'} {v.likes || 0}
                          </button>
                          <span>👁️ {v.views || 0}</span>
                        </div>
                        
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
                  <>
                    <div style={{ marginTop: 30, padding: 16, background: '#211640', borderRadius: 9, textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 15, color: '#aaa' }}>Arquivo selecionado:</p>
                      <p style={{ margin: '5px 0 0', fontSize: 16, fontWeight: 600 }}>{file.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 14, color: '#ac98f8' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <input
                        type="text"
                        placeholder="Digite o título do vídeo..."
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          background: '#211640',
                          border: '2px solid #8d6aff',
                          borderRadius: 10,
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 500,
                          outline: 'none',
                          transition: 'all 0.3s'
                        }}
                      />
                      <p style={{ 
                        margin: '8px 0 0', 
                        fontSize: 13, 
                        color: '#aaa', 
                        textAlign: 'left',
                        paddingLeft: 4
                      }}>
                        📁 Nome do arquivo: <span style={{ color: '#8d6aff' }}>{file.name}</span>
                      </p>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <p style={{ fontSize: 15, color: '#aaa', marginBottom: 10, textAlign: 'left' }}>🖼️ Thumbnail personalizada (opcional):</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => { 
                          const thumb = e.target.files[0]; 
                          if (thumb) { 
                            setThumbnailFile(thumb); 
                            showToast('Thumbnail selecionada!', 'success'); 
                          } 
                        }} 
                        style={{ display: 'none' }} 
                        id="thumbnail-input" 
                      />
                      <label htmlFor="thumbnail-input" style={{ display: 'inline-block', padding: '10px 24px', background: '#352f5b', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                        Selecionar Imagem
                      </label>
                      {thumbnailFile && (
                        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#8d6aff', textAlign: 'left' }}>
                          ✓ {thumbnailFile.name}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div style={{ 
                  marginTop: 20, 
                  padding: '15px 20px', 
                  background: isRestricted ? '#2d1a1a' : '#1a1a1a', 
                  borderRadius: 10,
                  border: isRestricted ? '1px solid #e53e3e' : '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }} onClick={() => setIsRestricted(!isRestricted)}>
                  <input 
                    type="checkbox" 
                    checked={isRestricted}
                    onChange={(e) => setIsRestricted(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label style={{ fontSize: 15, fontWeight: 500, color: isRestricted ? '#ff6b6b' : '#ccc', cursor: 'pointer' }}>
                    🔒 Tornar vídeo privado
                  </label>
                </div>

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

          {activeTab === 'admin' && isAdmin && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ marginBottom: 20 }}>👮‍♂️ Painel de Controle</h2>

              <div style={{ background: '#20153e', padding: 20, borderRadius: 12, marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin:0 }}>👥 Gerenciar Usuários</h3>
                  <button onClick={loadUsers} style={{ cursor:'pointer', padding:'4px 10px'}}>Atualizar</button>
                </div>
                <div style={{maxHeight: 300, overflowY: 'auto', overflowX: 'auto'}}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: '500px' }}>
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
                            <button onClick={() => resetPassword(u.id)} style={{ marginRight: 10, background:'#eab308', border:'none', padding:'4px 10px', borderRadius:4, cursor:'pointer', color:'#000', fontSize: 12 }}>🔑 Resetar</button>
                            <button onClick={() => banUser(u.id)} style={{ background:'#ef4444', border:'none', padding:'4px 10px', borderRadius:4, cursor:'pointer', color:'#fff', fontSize: 12 }}>🚫 Banir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ background: '#1a1a1a', padding: 20, borderRadius: 12 }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20, flexWrap: 'wrap', gap: '10px'}}>
                  <h3 style={{color:'#fff', margin:0}}>📜 Central de Inteligência (Logs)</h3>
                  <button onClick={fetchLogs} style={{padding:'8px 16px', cursor:'pointer'}}>Atualizar</button>
                </div>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', color:'#ccc', fontSize: 13, minWidth: '1200px'}}>
  <thead>
    <tr style={{background:'#333', color:'#fff', textAlign:'left'}}>
      <th style={{padding:8}}>Data/Hora</th>
      <th style={{padding:8}}>Usuário</th>
      <th style={{padding:8}}>IP Real</th>
      <th style={{padding:8}}>Localização</th>
      <th style={{padding:8}}>Dispositivo</th>
      <th style={{padding:8}}>Sistema</th>
      <th style={{padding:8}}>Navegador</th>
      <th style={{padding:8}}>Fingerprint</th>
      <th style={{padding:8}}>Ação</th>
    </tr>
  </thead>
  <tbody>
    {logs.map(log => (
      <tr key={log.id} style={{borderBottom:'1px solid #444'}}>
        <td style={{padding:8, fontSize: 11}}>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
        <td style={{padding:8, fontWeight:'bold', color: log.username ? '#8d6aff' : '#aaa'}}>
          {log.username || 'Anônimo'}
        </td>
        <td style={{padding:8, color:'#ff6f4e', fontFamily:'monospace', fontSize: 11}}>
          {log.ip}
        </td>
        <td style={{padding:8, color:'#10b981', fontSize: 11}}>
          {log.city ? `${log.city}, ${log.country}` : log.country || 'N/A'}
          {log.latitude && log.longitude && (
            <div style={{fontSize: 10, color: '#666'}}>
              📍 {parseFloat(log.latitude).toFixed(4)}, {parseFloat(log.longitude).toFixed(4)}
            </div>
          )}
        </td>
        <td style={{padding:8, fontSize: 11}}>{log.device_type}</td>
        <td style={{padding:8, fontSize: 11}}>{log.os || 'N/A'}</td>
        <td style={{padding:8, fontSize: 11}}>{log.browser || 'N/A'}</td>
        <td style={{padding:8, fontFamily:'monospace', fontSize: 10, color: '#fbbf24'}}>
          {log.fingerprint ? log.fingerprint.substring(0, 8) : 'N/A'}
        </td>
        <td style={{padding:8, fontWeight: 'bold', color: log.action.includes('FAILED') || log.action.includes('BLOCKED') ? '#ef4444' : '#fff', fontSize: 11}}>
          {log.action}
        </td>
      </tr>
    ))}
  </tbody>
</table>

                </div>
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <Inbox user={user} usersList={usersList} onMessageRead={() => user && loadNotifications(user.id)} />
          )}

          {activeTab === 'secret' && showSecretTab && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20, color: '#e53e3e' }}>
                🔥 SAFADEZA ({loading ? 'Carregando...' : `${sortedSecretVideos.length} vídeo${sortedSecretVideos.length !== 1 ? 's' : ''}`})
              </h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{ width: 55, height: 55, border: '5px solid #303030', borderTop: '5px solid #e53e3e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : sortedSecretVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa', border: '2px dashed #e53e3e' }}>
                  <div style={{ fontSize: 41, marginBottom: 18 }}>🔥</div>
                  <p style={{ fontSize: 19, margin: 0, color: '#e53e3e', fontWeight: 600 }}>Nenhum conteúdo restrito encontrado</p>
                  <p style={{ fontSize: 14, color: '#888', marginTop: 10 }}>Use o checkbox "Tornar vídeo privado" ao enviar</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                  {sortedSecretVideos.map((v) => (
                    <div key={v.id} style={{ background: "#3d1a1a", borderRadius: 14, overflow: "hidden", position: "relative", boxShadow: "0 4px 28px #e53e3e55", paddingBottom: 6, border: '2px solid #e53e3e' }}>
                      {canDelete(v.user_id?.toString()) && (
                        <button onClick={() => deleteVideo(v.id, v.user_id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, color: '#fff' }}>🗑️</button>
                      )}
                      <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a0c0c", position: 'relative' }}>
                        {v.thumbnail_url && (
                          <img 
                            src={v.thumbnail_url} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }} 
                            alt={v.title}
                          />
                        )}
                        <iframe
                          src={v.gdrive_id ? `https://drive.google.com/file/d/${v.gdrive_id}/preview` : (v.bunny_id ? `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '548459'}/${v.bunny_id}?autoplay=false` : "")}
                          style={{ width: "100%", height: "100%", border: 'none', borderRadius: 7, position: 'relative', zIndex: 1 }}
                          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowFullScreen />
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ background: '#e53e3e', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>🔒 PRIVADO</span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</h3>
                        <p style={{ margin: '9px 0 0', fontSize: 14, color: '#aaa' }}>Por {v.username || 'Anônimo'}</p>
                        <div style={{ marginTop: 7, fontSize: 15, color: "#ffb3b3", display: 'flex', gap: 15 }}>
                          <button onClick={() => toggleLike(v.id)} style={{ background: 'none', border: 'none', color: v.user_liked ? '#ff6b9d' : '#ffb3b3', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {v.user_liked ? '❤️' : '🤍'} {v.likes || 0}
                          </button>
                          <span>👁️ {v.views || 0}</span>
                        </div>
                        
                        <button onClick={() => openComments(v)} style={{
                           marginTop: 12, width:'100%', padding:'8px', background:'#5b2f2f', 
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
        </div>
        
        {showCommentsModal && currentVideo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex',
            justifyContent: 'center', alignItems: 'center', padding: '20px'
          }} onClick={() => setShowCommentsModal(false)}>
            
            <div style={{
              background: '#1a1a1a', width: '100%', maxWidth: 600, maxHeight: '90vh',
              borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ padding: 16, borderBottom: '1px solid #333', display:'flex', justifyContent:'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>Comentários: {currentVideo.title}</h3>
                <button onClick={() => setShowCommentsModal(false)} style={{background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer', minWidth: 30}}>✕</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {videoComments.length === 0 ? (
                  <p style={{ color: '#aaa', textAlign: 'center' }}>Seja o primeiro a comentar!</p>
                ) : (
                  videoComments.map((c, i) => (
                    <div key={i} style={{ marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'bold', color: '#8d6aff' }}>{c.username || 'Anônimo'}</span>
                          <span style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        {(user && (c.user_id === user.id || isAdmin)) && (
                          <button 
                            onClick={() => deleteComment(c.id)} 
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer', 
                              fontSize: 14,
                              padding: '4px 8px'
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, color: '#ddd', wordBreak: 'break-word' }}>{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendComment} style={{ padding: 16, background: '#222', borderTop: '1px solid #333', display: 'flex', gap: 10 }}>
                <input 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Escreva algo legal..."
                  style={{ flex: 1, padding: 10, borderRadius: 20, border: 'none', background: '#333', color: '#fff', fontSize: 16 }}
                />
                <button type="submit" style={{ background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 20, padding: '0 20px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Enviar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        /* ============================================ */
        /* MOBILE LAYOUT - RESPONSIVO PROFISSIONAL */
        /* ============================================ */

        @media (max-width: 768px) {
          /* HEADER MOBILE */
          header {
            padding: 12px 16px !important;
            gap: 10px !important;
          }

          header h1 {
            font-size: 20px !important;
            letter-spacing: 1px !important;
            min-width: auto !important;
          }

          header > div {
            width: 100% !important;
            justify-content: space-between !important;
            gap: 6px !important;
          }

          header button,
          header span {
            font-size: 11px !important;
            padding: 6px 10px !important;
            white-space: nowrap !important;
          }

          header button[style*="maxWidth: 150px"] {
            max-width: 100px !important;
          }

          header button strong {
            max-width: 60px !important;
          }

          /* TABS MOBILE */
          div[style*="gap: 24"] {
            padding: 0 12px !important;
            gap: 8px !important;
          }

          div[style*="gap: 24"] button {
            padding: 12px 10px !important;
            font-size: 13px !important;
            min-width: auto !important;
          }

          /* CONTAINER PRINCIPAL */
          div[style*="padding: 38"] {
            padding: 16px 12px !important;
          }

          /* BUSCA E FILTROS */
          div[style*="marginBottom: 20"][style*="flexWrap: wrap"] {
            gap: 10px !important;
          }

          div[style*="marginBottom: 20"] input[type="text"] {
            min-width: 100% !important;
            font-size: 14px !important;
            padding: 10px 16px !important;
          }

          div[style*="marginBottom: 20"] select {
            width: 100% !important;
            min-width: 100% !important;
            font-size: 14px !important;
          }

          /* GRID DE VÍDEOS */
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }

          /* TÍTULOS */
          h1 {
            font-size: 20px !important;
          }

          h2 {
            font-size: 18px !important;
          }

          h3 {
            font-size: 16px !important;
          }

          /* UPLOAD AREA */
          div[style*="maxWidth: 620"] {
            max-width: 100% !important;
          }

          /* MODAIS */
          div[style*="position: fixed"][style*="padding: '20px'"] > div {
            width: 95% !important;
            max-width: 95% !important;
            padding: 24px 16px !important;
          }

          /* MODAL COMENTÁRIOS */
          div[style*="maxWidth: 600"] {
            width: 95% !important;
            max-width: 95% !important;
          }

          /* TABELAS ADMIN */
          div[style*="overflowX: auto"] table {
            font-size: 11px !important;
            min-width: 600px !important;
          }

          div[style*="overflowX: auto"] table th,
          div[style*="overflowX: auto"] table td {
            padding: 6px !important;
          }

          /* INBOX MOBILE */
          div[style*="height: 70vh"] {
            flex-direction: column !important;
            height: auto !important;
            min-height: 70vh !important;
          }

          div[style*="flex: 0 0 300px"] {
            flex: 1 1 auto !important;
            width: 100% !important;
            max-height: 40vh !important;
          }

          /* BOTÕES TOUCH FRIENDLY */
          button {
            min-height: 44px !important;
            font-size: 14px !important;
          }

          /* TOAST MOBILE */
          div[style*="position: fixed"][style*="top: 24"] {
            top: 16px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
          }
        }

        /* ============================================ */
        /* MOBILE PEQUENO (até 480px) */
        /* ============================================ */

        @media (max-width: 480px) {
          header {
            padding: 10px 12px !important;
          }

          header h1 {
            font-size: 18px !important;
          }

          header button,
          header span {
            font-size: 10px !important;
            padding: 5px 8px !important;
          }

          div[style*="padding: 38"] {
            padding: 12px 8px !important;
          }

          h2 {
            font-size: 16px !important;
          }

          /* Tabs ainda menores */
          div[style*="gap: 24"] button {
            padding: 10px 8px !important;
            font-size: 12px !important;
          }
        }

        /* ============================================ */
        /* LANDSCAPE MOBILE */
        /* ============================================ */

        @media (max-width: 900px) and (orientation: landscape) {
          header {
            padding: 8px 12px !important;
          }

          div[style*="padding: 38"] {
            padding: 12px !important;
          }

          div[style*="height: 70vh"] {
            height: 85vh !important;
          }
        }

        /* ============================================ */
        /* TOUCH DEVICES */
        /* ============================================ */

        @media (hover: none) and (pointer: coarse) {
          button {
            min-height: 44px !important;
            min-width: 44px !important;
          }

          input,
          textarea,
          select {
            font-size: 16px !important; /* Evita zoom no iOS */
          }
        }

        /* ============================================ */
        /* iOS SAFE AREA */
        /* ============================================ */

        @supports (padding: env(safe-area-inset-top)) {
          header {
            padding-top: max(16px, env(safe-area-inset-top)) !important;
          }

          div[style*="padding: 38"] {
            padding-bottom: max(38px, env(safe-area-inset-bottom)) !important;
          }
        }

        /* ============================================ */
        /* SCROLL SUAVE EM MOBILE */
        /* ============================================ */

        @media (max-width: 768px) {
          * {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

    </>
  );
}
