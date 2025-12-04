import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import axios from "axios";
import Head from "next/head";
import { getDeviceFingerprint } from '../lib/fingerprint';


const TermsModal = dynamic(() => import('../components/TermsModal'), { ssr: false });
const Inbox = dynamic(() => import('../components/inbox'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL;


const sendFingerprint = async (action, metadata = {}) => {
  try {
    const deviceFingerprint = await getDeviceFingerprint();
    
    const fingerprintHash = typeof deviceFingerprint.hash === 'string' 
      ? deviceFingerprint.hash 
      : (typeof deviceFingerprint.secondaryHash === 'string' 
          ? deviceFingerprint.secondaryHash 
          : 'unknown');
    
    return {
      ...metadata,
      ...deviceFingerprint,
      fingerprint: fingerprintHash,
      action: action
    };
  } catch (err) {
    console.error('Erro ao capturar fingerprint:', err);
    return {
      ...metadata,
      fingerprint: navigator.userAgent || 'unknown',
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      action: action
    };
  }
};

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
        {video.gdrive_id ? (
          <iframe
            src={`https://drive.google.com/file/d/${video.gdrive_id}/preview`}
            style={{ width: "100%", height: "100%", border: 'none' }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" 
            allowFullScreen 
          />
        ) : video.bunny_id ? (
          <iframe
            src={`https://iframe.mediadelivery.net/embed/548459/${video.bunny_id}?autoplay=false&preload=true`}
            style={{ width: "100%", height: "100%", border: 'none' }}
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" 
            allowFullScreen 
          />
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
        <p style={{ margin: '9px 0 0', fontSize: 14, color: '#aaa' }}>Por {video.username || 'Anônimo'}</p>
        <div style={{ marginTop: 7, fontSize: 15, color: isSecret ? "#ffb3b3" : "#c2bcf7", display: 'flex', gap: 15 }}>
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
            width:'100%', 
            padding:'8px', 
            background: isSecret ? '#5b2f2f' : '#352f5b', 
            color:'#fff', 
            border:'none', 
            borderRadius:6, 
            cursor:'pointer'
          }}
        >
          💬 Ver Comentários
        </button>
      </div>
    </div>
  );
}
);

export default function Home() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
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


  const [page, setPage] = useState(1);
  const VIDEOS_PER_PAGE = 12;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    const acceptedTerms = localStorage.getItem('termsAccepted');

    if (acceptedTerms === 'true') {
      setTermsAccepted(true);
    } else {
      setShowTerms(true);
    }
    
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
    
    if (acceptedTerms === 'true') {
      loadVideos();
    }
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


  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, sortBy]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleAcceptTerms = async () => {
    localStorage.setItem('termsAccepted', 'true');
    setTermsAccepted(true);
    setShowTerms(false);
    
    try {
      const fingerprintData = await sendFingerprint('TERMS_ACCEPTED', {
  userId: user?.id || null,
});
await axios.post(`${API}/api/log-terms`, fingerprintData);
    } catch (err) {
      console.error('Erro ao registrar aceitação:', err);
    }
    
    showToast('Termos aceitos! Bem-vindo ao SINOPINHAS 🎉', 'success');
    loadVideos();
  };

  const handleDeclineTerms = () => {
    alert('Você precisa aceitar os termos para usar a plataforma.');
    window.location.href = 'https://www.google.com';
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

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/videos${user ? `?user_id=${user.id}` : ''}`);
      setVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const loadSecretVideos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/secret-videos${user ? `?user_id=${user.id}` : ''}`);
      setSecretVideos(res.data);
    } catch (err) {
      showToast('Erro ao carregar vídeos restritos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const canDelete = useCallback((ownerId) => {
    return isAdmin || (user && user.id.toString() === ownerId);
  }, [isAdmin, user]);

  const toggleLike = useCallback(async (videoId) => {
    if (!user) return showToast('Faça login para curtir', 'error');
    try {
      await axios.post(`${API}/api/videos/${videoId}/like`, { user_id: user.id });
      await loadVideos();
      if (activeTab === 'secret') await loadSecretVideos();
    } catch (err) {
      showToast('Erro ao curtir vídeo', 'error');
    }
  }, [user, showToast, loadVideos, loadSecretVideos, activeTab]);

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

  const openComments = useCallback(async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    try {
      const res = await axios.get(`${API}/api/comments/${video.id}`);
      setVideoComments(res.data);
      
      if (user) {
        await axios.post(`${API}/api/videos/${video.id}/view`, { user_id: user.id });
      }
    } catch (err) { console.error(err); }
  }, [user]);

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
      const fingerprintData = await sendFingerprint(isLogin ? 'USER_LOGIN' : 'USER_REGISTER', {
  username,
  auth_type: isLogin ? 'login' : 'register',
});

      
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await axios.post(`${API}${endpoint}`, { 
        username, 
        password,
        ...fingerprintData
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

  const deleteVideo = useCallback(async (videoId, ownerId) => {
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
  }, [user, isAdmin, adminPassword, showToast, loadVideos, loadSecretVideos]);


  const filteredVideos = useMemo(() => {
    return videos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const filteredSecretVideos = useMemo(() => {
    return secretVideos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [secretVideos, searchQuery]);

  const sortVideos = useCallback((videoList) => {
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
  }, [sortBy]);

  const sortedVideos = useMemo(() => sortVideos(filteredVideos), [filteredVideos, sortVideos]);
  const sortedSecretVideos = useMemo(() => sortVideos(filteredSecretVideos), [filteredSecretVideos, sortVideos]);


  const paginatedVideos = useMemo(() => {
    return sortedVideos.slice(0, page * VIDEOS_PER_PAGE);
  }, [sortedVideos, page]);

  const paginatedSecretVideos = useMemo(() => {
    return sortedSecretVideos.slice(0, page * VIDEOS_PER_PAGE);
  }, [sortedSecretVideos, page]);

  const hasMoreVideos = paginatedVideos.length < sortedVideos.length;
  const hasMoreSecretVideos = paginatedSecretVideos.length < sortedSecretVideos.length;


  if (!termsAccepted) {
    return (
      <>
        <Head>
          <title>SINOPINHAS - Termos de Uso</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983" crossOrigin="anonymous"></script>
        </Head>
        {showTerms && (
          <TermsModal 
            onAccept={handleAcceptTerms}
            onDecline={handleDeclineTerms}
          />
        )}
      </>
    );
  }


  return (
    <>
      <Head>
        <title>SINOPINHAS - Streaming de Vídeos</title>
        <meta name="description" content="Plataforma de streaming de vídeos" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18142a" />
        <link rel="preconnect" href={API} />
        <link rel="dns-prefetch" href={API} />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983" crossOrigin="anonymous"></script>
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease-out'
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
                      loading="lazy"
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
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                    {paginatedVideos.map((v) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        onDelete={deleteVideo}
                        onLike={toggleLike}
                        onOpenComments={openComments}
                        canDelete={canDelete(v.user_id?.toString())}
                        isSecret={false}
                      />
                    ))}
                  </div>
                  
                  {hasMoreVideos && (
                    <div style={{ textAlign: 'center', marginTop: 30 }}>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        style={{ 
                          padding: '12px 32px',
                          background: '#8d6aff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Carregar Mais
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'secret' && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 20, color: '#ff6b9d' }}>
                🔒 CONTEÚDO RESTRITO ({sortedSecretVideos.length})
              </h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                  <div style={{ width: 55, height: 55, border: '5px solid #303030', borderTop: '5px solid #e53e3e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : sortedSecretVideos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 64, background: '#1a1a1a', borderRadius: 16, color: '#aaa' }}>
                  <div style={{ fontSize: 41, marginBottom: 18 }}>🔒</div>
                  <p style={{ fontSize: 19, margin: 0 }}>Nenhum conteúdo restrito encontrado</p>
                  <p style={{ fontSize: 14, marginTop: 8 }}>Use o checkbox "Tornar vídeo privado" ao enviar</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 28 }}>
                    {paginatedSecretVideos.map((v) => (
                      <VideoCard
                        key={v.id}
                        video={v}
                        onDelete={deleteVideo}
                        onLike={toggleLike}
                        onOpenComments={openComments}
                        canDelete={canDelete(v.user_id?.toString())}
                        isSecret={true}
                      />
                    ))}
                  </div>
                  
                  {hasMoreSecretVideos && (
                    <div style={{ textAlign: 'center', marginTop: 30 }}>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        style={{ 
                          padding: '12px 32px',
                          background: '#e53e3e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Carregar Mais
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
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
                    placeholder="📁 Nome do arquivo: {file.name}"
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
          )}

          {activeTab === 'inbox' && user && (
            <Inbox user={user} API={API} />
          )}

          {activeTab === 'admin' && isAdmin && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>🛡️ Painel Admin</h2>
              
              <div style={{ marginBottom: 40 }}>
                <h3 style={{ fontSize: 20, marginBottom: 16 }}>👥 Usuários Cadastrados ({usersList.length})</h3>
                <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#303030' }}>
                        <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Usuário</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #303030' }}>
                          <td style={{ padding: 12 }}>#{u.id}</td>
                          <td style={{ padding: 12 }}>{u.username}</td>
                          <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                            <button onClick={() => resetPassword(u.id)} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                              Resetar Senha
                            </button>
                            <button onClick={() => banUser(u.id)} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                              Banir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 20, marginBottom: 16 }}>📊 Logs de Auditoria (últimos 100)</h3>
                <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'auto', maxHeight: 600 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#303030', zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: 10, textAlign: 'left', whiteSpace: 'nowrap' }}>Data/Hora</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Usuário</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>IP Real</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Localização</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Dispositivo</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Sistema</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Navegador</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Resolução</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Fingerprint</th>
                        <th style={{ padding: 10, textAlign: 'left' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #303030' }}>
                          <td style={{ padding: 10, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                          <td style={{ padding: 10 }}>{log.username || 'Anônimo'}</td>
                          <td style={{ padding: 10, fontFamily: 'monospace' }}>{log.ip}</td>
                          <td style={{ padding: 10 }}>
                            {log.city ? `${log.city}, ${log.country}` : log.country || 'N/A'}
                            {log.latitude && log.longitude && (
                              <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                                📍 {parseFloat(log.latitude).toFixed(4)}, {parseFloat(log.longitude).toFixed(4)}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 10 }}>{log.device_type}</td>
                          <td style={{ padding: 10 }}>{log.os || 'N/A'}</td>
                          <td style={{ padding: 10 }}>{log.browser || 'N/A'}</td>
                          <td style={{ padding: 10 }}>{log.screen_resolution || 'N/A'}</td>
                          <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 11 }}>
                            {log.fingerprint ? log.fingerprint.substring(0, 12) + '...' : 'N/A'}
                          </td>
                          <td style={{ padding: 10, fontWeight: 600, color: '#8d6aff' }}>{log.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </div>

        {showCommentsModal && currentVideo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 9998, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20,
            overflowY: 'auto'
          }} onClick={() => setShowCommentsModal(false)}>

            <div style={{
              background: '#1a1a1a', borderRadius: 16, padding: 32,
              maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>💬 Comentários - {currentVideo.title}</h2>
              
              <div style={{ marginBottom: 24 }}>
                {videoComments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', padding: 20 }}>Seja o primeiro a comentar!</p>
                ) : (
                  videoComments.map((c, i) => (
                    <div key={i} style={{ 
                      background: '#252525', 
                      padding: 16, 
                      borderRadius: 10, 
                      marginBottom: 12,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {c.avatar && (
                          <img src={c.avatar} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt={c.username} />
                        )}
                        <strong style={{ fontSize: 15 }}>{c.username}</strong>
                        <span style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{c.comment}</p>
                      {(user?.id === c.user_id || isAdmin) && (
                        <button 
                          onClick={() => deleteComment(c.id)}
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 8px',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          Deletar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {user && (
                <form onSubmit={sendComment}>
                  <textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#252525',
                      border: '1px solid #303030',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 15,
                      resize: 'vertical',
                      marginBottom: 12
                    }}
                  />
                  <button type="submit" style={{
                    width: '100%',
                    padding: 12,
                    background: '#8d6aff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    Enviar Comentário
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}
      </style>
    </>
  );
}
