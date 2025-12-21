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
function TabPane({ active, children }) {
  return (
    <div style={{ display: active ? 'block' : 'none', animation: active ? 'fadeIn 0.4s ease' : 'none' }}>
      {children}
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
    loadNotifications
  } = useAuth(showToast);

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
        <title>{currentVideo ? `${currentVideo.title} | SINOPINHAS` : initialVideo ? `${initialVideo.title} | SINOPINHAS` : 'SINOPINHAS by SHURA'}</title>
        <meta name="description" content={currentVideo?.description || initialVideo?.description || "Assista a vídeos exclusivos, confira o clima em tempo real, as últimas notícias e os melhores eventos de Sinop, MT."} />
        <meta property="og:type" content="video.other" />
        <meta property="og:title" content={currentVideo?.title || initialVideo?.title || "SINOPINHAS"} />
        <meta property="og:description" content={currentVideo?.description || initialVideo?.description || "Acompanhe tudo o que acontece em Sinop: Vídeos, Fotos, Clima e Eventos locais."} />
        <meta property="og:image" content="https://sinopinhas.vercel.app/og-default.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1a1625" />
        <link rel="icon" href="/favicon.ico" />
        {(activeTab === 'videos' || activeTab === 'secret') && !showAuth && !showAdminAuth && !showSecretAuth && !showProfile && (
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3444303701607983" crossOrigin="anonymous"></script>
        )}
      </Head>

      <div style={{
        minHeight: '100vh', background: 'var(--bg-gradient)', color: 'var(--text-color)',
        fontFamily: 'Arial, sans-serif', transition: 'background 0.3s ease, color 0.3s ease'
      }}>
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

        {showCommentsModal && currentVideo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)',
            zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto'
          }} onClick={() => setShowCommentsModal(false)}>
            <div style={{
              background: 'var(--card-bg)', borderRadius: 16, padding: 32, maxWidth: 600, width: '100%',
              maxHeight: '90vh', overflowY: 'auto', color: 'var(--text-color)', border: '1px solid var(--border-color)'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 24px', fontSize: 22 }}>💬 Comentários - {currentVideo.title}</h2>
              <div style={{ marginBottom: 24 }}>
                {videoComments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', padding: 20 }}>Seja o primeiro a comentar!</p>
                ) : (
                  videoComments.map((c, i) => (
                    <div key={i} style={{ background: 'var(--input-bg)', padding: 16, borderRadius: 10, marginBottom: 12, position: 'relative', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {c.avatar && <img src={c.avatar} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt={c.username} />}
                        <strong style={{ fontSize: 15 }}>{c.username}</strong>
                        <span style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{c.comment}</p>
                      {(user?.id === c.user_id || isAdmin) && (
                        <button onClick={() => handleDeleteComment(c.id)} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 12, cursor: 'pointer' }} > Deletar </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              {user && (
                <form onSubmit={sendComment}>
                  <textarea placeholder="Escreva um comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows="3" style={{ width: '100%', padding: 12, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-color)', fontSize: 15, resize: 'vertical', marginBottom: 12 }} />
                  <button type="submit" style={{ width: '100%', padding: 12, background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}> Enviar Comentário </button>
                </form>
              )}
            </div>
          </div>
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
