import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useMemo } from "react";
import Head from "next/head";

// Components
import VideoCard from '../components/VideoCard';
import Header from '../components/layout/Header';
import UploadSection from '../components/UploadSection';
import AdminPanel from '../components/admin/AdminPanel';
import AuthModal from '../components/auth/AuthModal';
import AdminAuthModal from '../components/auth/AdminAuthModal';
import SecretAuthModal from '../components/auth/SecretAuthModal';
import ProfileModal from '../components/auth/ProfileModal';

// Services
import {
  logTermsAcceptance,
  fetchNotifications,
  fetchVideos,
  fetchSecretVideos,
  likeVideo,
  fetchComments,
  viewVideo,
  postComment,
  deleteComment,
  removeVideo
} from '../services/api';

const TermsModal = dynamic(() => import('../components/TermsModal'), { ssr: false });
const Inbox = dynamic(() => import('../components/inbox'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const [videos, setVideos] = useState([]);
  const [secretVideos, setSecretVideos] = useState([]);

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoComments, setVideoComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [unreadCount, setUnreadCount] = useState(0);

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
      if (user) await logTermsAcceptance(user.id);
      else await logTermsAcceptance(null);
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
      const data = await fetchNotifications(userId);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVideos(user ? user.id : null);
      setVideos(data);
    } catch (err) {
      showToast('Erro ao carregar vídeos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const loadSecretVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSecretVideos(user ? user.id : null);
      setSecretVideos(data);
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
      await likeVideo(videoId, user.id);
      await loadVideos();
      if (activeTab === 'secret') await loadSecretVideos();
    } catch (err) {
      showToast('Erro ao curtir vídeo', 'error');
    }
  }, [user, showToast, loadVideos, loadSecretVideos, activeTab]);

  const openComments = useCallback(async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    try {
      const data = await fetchComments(video.id);
      setVideoComments(data);
      if (user) {
        await viewVideo(video.id, user.id);
      }
    } catch (err) { console.error(err); }
  }, [user]);

  const sendComment = async (e) => {
    e.preventDefault();
    if (!user) return showToast('Faça login para comentar', 'error');
    if (!newComment.trim()) return;

    try {
      await postComment(currentVideo.id, user.id, newComment);
      setNewComment("");
      const data = await fetchComments(currentVideo.id);
      setVideoComments(data);
      showToast('Comentário enviado!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao comentar', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Deletar este comentário?')) return;
    try {
      await deleteComment(commentId, user.id, isAdmin ? adminPassword : null);
      const data = await fetchComments(currentVideo.id);
      setVideoComments(data);
      showToast('Comentário deletado!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao deletar comentário', 'error');
    }
  };

  const deleteVideo = useCallback(async (videoId, ownerId) => {
    if (!user && !isAdmin) return showToast('Faça login para deletar', 'error');
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;
    try {
      await removeVideo(videoId, user ? user.id : null, isAdmin ? adminPassword : null);
      showToast('Vídeo deletado!', 'success');
      await loadVideos();
      await loadSecretVideos();
    } catch (err) {
      showToast(err.message || 'Erro ao deletar', 'error');
    }
  }, [user, isAdmin, adminPassword, showToast, loadVideos, loadSecretVideos]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuth(false);
    if (userData.id) loadNotifications(userData.id);
  };

  const handleAdminAuthSuccess = (password) => {
    setIsAdmin(true);
    setAdminPassword(password);
    localStorage.setItem('adminPassword', password);
    setActiveTab('admin');
  };

  const handleLogout = () => {
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
    switch (sortBy) {
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

        <Header
          user={user}
          isAdmin={isAdmin}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowAuth={setShowAuth}
          setShowSecretAuth={setShowSecretAuth}
          setShowAdminAuth={setShowAdminAuth}
          showSecretTab={showSecretTab}
          unreadCount={unreadCount}
          setShowProfile={setShowProfile}
          logout={handleLogout}
          logoutAdmin={logoutAdmin}
        />

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onAuthSuccess={handleAuthSuccess}
            showToast={showToast}
          />
        )}

        {showProfile && (
          <ProfileModal
            user={user}
            setUser={setUser}
            onClose={() => setShowProfile(false)}
            showToast={showToast}
          />
        )}

        {showAdminAuth && (
          <AdminAuthModal
            onClose={() => setShowAdminAuth(false)}
            onAdminAuthSuccess={handleAdminAuthSuccess}
            showToast={showToast}
          />
        )}

        {showSecretAuth && (
          <SecretAuthModal
            onClose={() => setShowSecretAuth(false)}
            onSecretAuthSuccess={() => {
              setShowSecretTab(true);
              setActiveTab('secret');
            }}
            showToast={showToast}
          />
        )}

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
            <UploadSection
              user={user}
              setShowAuth={setShowAuth}
              showToast={showToast}
              loadVideos={loadVideos}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'inbox' && user && (
            <Inbox user={user} API={API} />
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminPanel
              adminPassword={adminPassword}
              showToast={showToast}
            />
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
                          onClick={() => handleDeleteComment(c.id)}
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
