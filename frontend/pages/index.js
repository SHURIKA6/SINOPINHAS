import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useComments } from "../hooks/useComments";
import Head from "next/head";
import { useRouter } from 'next/router';

import VideoCard from '../components/VideoCard';
import Header from '../components/layout/Header';
import UploadSection from '../components/UploadSection';
import AdminPanel from '../components/admin/AdminPanel';
import AuthModal from '../components/auth/AuthModal';
import AdminAuthModal from '../components/auth/AdminAuthModal';
import SecretAuthModal from '../components/auth/SecretAuthModal';
import ProfileModal from '../components/auth/ProfileModal';
import TermsModal from '../components/TermsModal';
import Inbox from '../components/inbox';
import HomeFeed from '../components/feed/HomeFeed';
import SecretFeed from '../components/feed/SecretFeed';
import NewsFeed from '../components/feed/NewsFeed';
import WeatherSection from '../components/WeatherSection';
import PlacesSection from '../components/PlacesSection';
import EventsSection from '../components/EventsSection';
import SupportModal from '../components/SupportModal';
import BottomNav from '../components/layout/BottomNav';

// Componente para persistir o estado das abas sem lazy loading
function TabPane({ active, children, direction = 'forward' }) {
  return (
    <div className={`tab-pane ${active ? 'active' : ''} ${direction}`}>
      {children}
      <style jsx>{`
        .tab-pane {
          display: none;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .tab-pane.active {
          display: block;
          opacity: 1;
          transform: translateY(0);
          animation: slideInUp 0.5s ease-out;
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

import {
  logTermsAcceptance,
  viewVideo
} from '../services/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';

// SEO e Dados Iniciais
export async function getServerSideProps(context) {
  const { v } = context.query;
  let initialVideo = null;

  if (v) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';
      const res = await fetch(`${apiUrl}/api/videos/${v}`);
      if (res.ok) initialVideo = await res.json();
    } catch (err) { }
  }

  return { props: { initialVideo } };
}

// Componente Principal
export default function Home({ initialVideo }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTabState] = useState('feed');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  // Sincroniza estado com a URL
  useEffect(() => {
    if (router.isReady) {
      const tab = router.query.tab;
      if (tab && ['feed', 'upload', 'eventos', 'news', 'lugares', 'weather', 'admin', 'inbox', 'secret'].includes(tab)) {
        setActiveTabState(tab);
      }
    }
  }, [router.isReady, router.query.tab]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    router.push({
      pathname: '/',
      query: { ...router.query, tab: tab }
    }, undefined, { shallow: true });
  };

  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [swipeStartX, setSwipeStartX] = useState(null);

  // Sistema de Swipe para Abas
  const handleTouchStart = (e) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (swipeStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = swipeStartX - endX;

    // Lista de abas principais
    const tabs = ['feed', 'news', 'eventos', 'lugares', 'weather'];
    const currentIndex = tabs.indexOf(activeTab);

    if (Math.abs(diff) > 80) { // Sensibilidade do swipe
      if (diff > 0 && currentIndex < tabs.length - 1) {
        // Swipe Esquerda -> Próxima Aba
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe Direita -> Aba Anterior
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    setSwipeStartX(null);
  };

  // Troca de Tema
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Carregar Tema e Recado
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    console.log("%ceu amo muito a anna julia assinado _Riad777", "color: #ff6b9d; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);");
  }, []);

  // Sistema de Toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const {
    user,
    setUser,
    isAdmin,
    adminPassword,
    unreadCount,
    handleAuthSuccess,
    handleAdminAuthSuccess,
    logout,
    logoutAdmin,
    loadNotifications,
    subscribeToNotifications
  } = useAuth(showToast);

  // Expoe para o window facilitar o acesso em modais profundos
  useEffect(() => {
    window.subscribeToPush = subscribeToNotifications;
  }, [subscribeToNotifications]);

  const [currentVideo, setCurrentVideo] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [newComment, setNewComment] = useState("");

  const {
    comments: videoComments,
    loadComments,
    addComment,
    removeComment
  } = useComments(showToast, user, isAdmin, adminPassword);

  useEffect(() => {
    const accepted = localStorage.getItem('terms_accepted');
    if (accepted) setTermsAccepted(true);
    else setShowTerms(true);
  }, []);

  // Aceitar Termos
  const handleAcceptTerms = async (locationData) => {
    setTermsAccepted(true);
    setShowTerms(false);
    localStorage.setItem('terms_accepted', 'true');
    try {
      await logTermsAcceptance({
        accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ...locationData
      });
    } catch (err) { }
  };

  // Recusar Termos
  const handleDeclineTerms = () => {
    alert("Você precisa aceitar os termos para usar a plataforma.");
  };

  // Logout
  const handleLogout = () => {
    logout();
    setActiveTab('videos');
  };

  // Abrir Comentários
  const openComments = useCallback(async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    await loadComments(video.id);
    if (user) {
      try { await viewVideo(video.id, user.id); } catch (e) { }
    }
  }, [loadComments, user]);

  // Enviar Comentário
  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const success = await addComment(currentVideo.id, newComment);
    if (success) setNewComment("");
  };

  // Deletar Comentário
  const handleDeleteComment = async (commentId) => {
    await removeComment(commentId, currentVideo.id);
  };

  // Permissão para Deletar
  const canDelete = useCallback((ownerId) => {
    return isAdmin || (user && user.id.toString() === ownerId);
  }, [isAdmin, user]);

  if (!mounted) return null;

  if (!termsAccepted) {
    return (
      <>
        <Head>
          <title>SINOPINHAS - Termos de Uso</title>
        </Head>
        {showTerms && (
          <TermsModal onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />
        )}
      </>
    );
  }

  // Estrutura da Página
  return (
    <>
      <Head>
        <title>{currentVideo ? `${currentVideo.title} | SINOPINHAS` : initialVideo ? `${initialVideo.title} | SINOPINHAS` : 'SINOPINHAS - O App de Sinop-MT'}</title>
        <meta name="description" content={currentVideo?.description || initialVideo?.description || "A maior plataforma de vídeos, notícias e guia de Sinop. Tudo sobre o Mato Grosso em um só lugar."} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sinopinhas.vercel.app/" />
        <meta property="og:title" content={currentVideo?.title || initialVideo?.title || "SINOPINHAS"} />
        <meta property="og:description" content={currentVideo?.description || initialVideo?.description || "Veja vídeos, fotos, notícias e muito mais de Sinop!"} />
        <meta property="og:image" content={currentVideo?.thumbnail || initialVideo?.thumbnail || "https://sinopinhas.vercel.app/og-default.jpg"} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={currentVideo?.title || initialVideo?.title || "SINOPINHAS"} />
        <meta property="twitter:description" content={currentVideo?.description || initialVideo?.description || "Veja vídeos, fotos, notícias e muito mais de Sinop!"} />
        <meta property="twitter:image" content={currentVideo?.thumbnail || initialVideo?.thumbnail || "https://sinopinhas.vercel.app/og-default.jpg"} />

        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0f0d15" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {(activeTab === 'feed' || activeTab === 'secret') && !showAuth && !showAdminAuth && !showSecretAuth && !showProfile && (
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983" crossOrigin="anonymous"></script>
        )}
      </Head>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-color)',
          fontFamily: 'Arial, sans-serif', transition: 'background 0.3s ease, color 0.3s ease'
        }}
      >
        {toast && (
          <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff', padding: '16px 24px', borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{toast.type === 'success' ? '✓' : '✕'}</span>
              <span style={{ fontWeight: 500 }}>{toast.message}</span>
            </div>
          </div>
        )}

        <Header
          user={user} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab}
          setShowAuth={setShowAuth} setShowSecretAuth={setShowSecretAuth} setShowAdminAuth={setShowAdminAuth}
          showSecretTab={showSecretTab} unreadCount={unreadCount} setShowProfile={setShowProfile}
          logout={handleLogout} logoutAdmin={logoutAdmin} theme={theme} toggleTheme={toggleTheme}
          setShowSupport={setShowSupport}
        />

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} showToast={showToast} />}
        {showProfile && <ProfileModal user={user} setUser={setUser} onClose={() => setShowProfile(false)} showToast={showToast} />}
        {showAdminAuth && <AdminAuthModal onClose={() => setShowAdminAuth(false)} onAdminAuthSuccess={handleAdminAuthSuccess} showToast={showToast} />}
        {showSecretAuth && <SecretAuthModal onClose={() => setShowSecretAuth(false)} onSecretAuthSuccess={() => { setShowSecretTab(true); setActiveTab('secret'); }} showToast={showToast} />}
        {showSupport && <SupportModal user={user} onClose={() => setShowSupport(false)} showToast={showToast} />}

        <div style={{ padding: '24px 16px', maxWidth: 1160, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* Aba Explorar (Feed Unificado) */}
          <TabPane active={activeTab === 'feed'}>
            <HomeFeed user={user} isAdmin={isAdmin} adminPassword={adminPassword} onVideoClick={openComments} showToast={showToast} canDelete={canDelete} filterType="all" />
          </TabPane>

          {/* Outras abas montadas sob demanda mas persistentes */}
          <TabPane active={activeTab === 'news'}>
            <NewsFeed />
          </TabPane>

          <TabPane active={activeTab === 'eventos'}>
            <EventsSection />
          </TabPane>

          <TabPane active={activeTab === 'lugares'}>
            <PlacesSection />
          </TabPane>

          <TabPane active={activeTab === 'weather'}>
            <WeatherSection />
          </TabPane>

          {/* Abas que podem ser montadas/desmontadas (formulários ou privadas) */}
          {activeTab === 'secret' && <SecretFeed user={user} isAdmin={isAdmin} adminPassword={adminPassword} onVideoClick={openComments} showToast={showToast} canDelete={canDelete} />}
          {activeTab === 'upload' && <UploadSection user={user} setShowAuth={setShowAuth} showToast={showToast} setActiveTab={setActiveTab} />}
          {activeTab === 'inbox' && user && <Inbox user={user} API={API} isAdmin={isAdmin} adminPassword={adminPassword} onMessageRead={() => loadNotifications(user.id)} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel adminPassword={adminPassword} showToast={showToast} />}
        </div>

        {/* Comment Drawer (Slide-up) */}
        <div className={`drawer-container ${showCommentsModal ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header" onClick={() => setShowCommentsModal(false)}>
            <div className="drawer-handle" />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              💬 Comentários {currentVideo && `- ${currentVideo.title}`}
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
            {videoComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <p>Ninguém comentou ainda. Seja o primeiro!</p>
              </div>
            ) : (
              videoComments.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <img src={c.avatar || '/favicon.ico'} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: 'var(--input-bg)' }} alt="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 14 }}>{c.username}</strong>
                      <span style={{ fontSize: 10, opacity: 0.5 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-color)', opacity: 0.9 }}>{c.comment}</p>
                    {canDelete(c.user_id?.toString()) && (
                      <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, padding: '4px 0', cursor: 'pointer', fontWeight: 700 }}>Remover</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {user && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px env(safe-area-inset-bottom, 20px)', background: 'var(--bg-color)', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={sendComment} style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder="Diga algo legal..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 24, color: 'var(--text-color)', fontSize: 14 }}
                />
                <button type="submit" style={{ width: 44, height: 44, background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 18 }}>➜</button>
              </form>
            </div>
          )}
        </div>

        {/* Backdrop for Drawer */}
        {showCommentsModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowCommentsModal(false)}
          />
        )}
      </div>

      {showInstallBtn && (
        <div style={{
          position: 'fixed',
          bottom: 85,
          left: 16,
          right: 16,
          background: 'linear-gradient(135deg, #8d6aff 0%, #6040e6 100%)',
          padding: '12px 20px',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 9999,
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📲</span>
            <div>
              <strong style={{ display: 'block', color: '#fff', fontSize: 14 }}>Instalar SINOPINHAS</strong>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Acesso rápido na tela inicial</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowInstallBtn(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', padding: '8px' }}>Depois</button>
            <button onClick={installApp} style={{ background: '#fff', border: 'none', color: '#8d6aff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Instalar</button>
          </div>
        </div>
      )}

      {mounted && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCount={unreadCount}
          isAdmin={isAdmin}
        />
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 70px;
          }
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}
      </style>
    </>
  );
}
