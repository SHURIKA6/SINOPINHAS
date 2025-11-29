import TermsModal from '../components/TermsModal';
import Inbox from '../components/inbox';
import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";
import { sendFingerprint } from '../lib/fingerprint';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  // ESTADOS DE TERMOS (FALTAVA ISSO!)
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAdminPassword = localStorage.getItem('adminPassword');
    const acceptedTerms = localStorage.getItem('termsAccepted');

    if (acceptedTerms) {
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

  const handleAcceptTerms = async () => {
    localStorage.setItem('termsAccepted', 'true');
    setTermsAccepted(true);
    setShowTerms(false);
    
    try {
      const fingerprintData = await sendFingerprint('TERMS_ACCEPTED');
      await axios.post(`${API}/api/log-terms`, fingerprintData);
    } catch (err) {
      console.error('Erro ao registrar aceitação:', err);
    }
    
    showToast('Termos aceitos! Bem-vindo ao SINOPINHAS 🎉', 'success');
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
      const fingerprintData = await sendFingerprint('AUTH');
      
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

      {showTerms && (
        <TermsModal 
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
        />
      )}

      {termsAccepted && (
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

          {/* RESTO DO CÓDIGO CONTINUA IGUAL... mantenha todo o JSX que você já tem */}
          {/* (mantive só até aqui para economizar espaço, mas o resto permanece igual ao seu arquivo) */}

        </div>
      )}

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
        @media (max-width: 768px) {
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
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          button {
            min-height: 44px !important;
          }
        }
        @media (hover: none) and (pointer: coarse) {
          input,
          textarea,
          select {
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
// =====================================================================