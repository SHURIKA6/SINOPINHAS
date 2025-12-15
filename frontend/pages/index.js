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
const HomeFeed = dynamic(() => import('../components/feed/HomeFeed'), { ssr: false });
const SecretFeed = dynamic(() => import('../components/feed/SecretFeed'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL;

export async function getServerSideProps(context) {
  const { v } = context.query;
  let initialVideo = null;

  if (v) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      const res = await fetch(`${apiUrl}/api/videos/${v}`);
      if (res.ok) {
        initialVideo = await res.json();
      }
    } catch (err) {
      console.error('Error fetching video for SEO:', err);
    }
  }

  return {
    props: {
      initialVideo
    }
  };
}

export default function Home({ initialVideo }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState('videos');
  // State for Feeds is now internal to HomeFeed/SecretFeed
  const [unreadCount, setUnreadCount] = useState(0);

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

    // Legacy data loading removed. Feeds manage their own data.
  }, []);

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

  /* Removed loadVideos/loadSecretVideos/toggleLike - Handled by Feed components */

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

  // canDelete and deleteVideo logic moved to Feed, but canDelete helper kept for props if needed?
  // Actually canDelete is useful to pass down. I removed it in the chunk above by accident! 
  // I need to RESTORE canDelete.

  const canDelete = useCallback((ownerId) => {
    return isAdmin || (user && user.id.toString() === ownerId);
  }, [isAdmin, user]);

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

  /* Logic removed */

  if (!termsAccepted) {
    return (
      <>
        <Head>
          <title>SINOPINHAS - Termos de Uso</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
        <title>{currentVideo ? `${currentVideo.title} | Sinopinhas` : "SINOPINHAS - Streaming de Vídeos"}</title>
        <meta name="description" content={currentVideo?.description || "Plataforma de streaming de vídeos"} />

        {/* Open Graph / Social Media */}
        <meta property="og:type" content="video.other" />
        <meta property="og:title" content={currentVideo ? currentVideo.title : "SINOPINHAS"} />
        <meta property="og:description" content={currentVideo?.description || "Assista aos melhores vídeos exclusivos na Sinopinhas."} />
        <meta property="og:image" content="https://sinopinhas.vercel.app/og-default.jpg" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : 'https://sinopinhas.vercel.app'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#18142a" />
        <link rel="preconnect" href={API} />
        <link rel="dns-prefetch" href={API} />
        {(activeTab === 'videos' || activeTab === 'secret') && !showAuth && !showAdminAuth && !showSecretAuth && !showProfile && (
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983" crossOrigin="anonymous"></script>
        )}
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

        <div style={{ padding: '24px 16px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>


          {/* Feeds */}
          {activeTab === 'videos' && (
            <HomeFeed
              user={user}
              isAdmin={isAdmin}
              adminPassword={adminPassword}
              onVideoClick={openComments}
              showToast={showToast}
              canDelete={canDelete}
            />
          )}

          {activeTab === 'secret' && (
            <SecretFeed
              user={user}
              isAdmin={isAdmin}
              adminPassword={adminPassword}
              onVideoClick={openComments}
              showToast={showToast}
              canDelete={canDelete}
            />
          )}

          {/* Legacy Upload/Admin tabs below */}

          {/* Legacy grid removed */}

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
            <Inbox
              user={user}
              API={API}
              isAdmin={isAdmin}
              adminPassword={adminPassword}
            />
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
