import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useUIContext } from "../contexts/UIContext";
import { useComments } from "../hooks/useComments";
import { usePWA } from "../hooks/usePWA";
import { useSwipe } from "../hooks/useSwipe";
import Head from "next/head";
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from "framer-motion";

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
import Toast from '../components/common/Toast';
import CommentsDrawer from '../components/feed/CommentsDrawer';
import PublicProfileModal from '../components/modals/PublicProfileModal';
import AchievementUsersModal from '../components/modals/AchievementUsersModal';
import PhotoZoomModal from '../components/modals/PhotoZoomModal';

import ProfileFeed from '../components/feed/ProfileFeed';

import {
  logTermsAcceptance,
  viewVideo
} from '../services/api';

// API URL centralizada em services/api.js — importar de lá se necessário
const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev';

// Componente para persistir o estado das abas
function TabPane({ active, children }) {
  return (
    <div className={`tab-pane ${active ? 'active' : ''}`}>
      {children}
      <style jsx>{`
        .tab-pane {
          display: none;
        }
        .tab-pane.active {
          display: block;
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

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

export default function Home({ initialVideo }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.title = 'SINOPINHAS by SHURA';
  }, []);

  const router = useRouter();

  const {
    activeTab, setActiveTab,
    theme, toggleTheme,
    showProfile, setShowProfile,
    showSupport, setShowSupport,
    showSecretTab, setShowSecretTab,
    toast, showToast, setToast,
    publicProfileId, setPublicProfileId,
    achievementToList, setAchievementToList,
    zoomedPhoto, setZoomedPhoto
  } = useUIContext();

  const {
    user, setUser, isAdmin, adminPassword, unreadCount,
    handleAuthSuccess, handleAdminAuthSuccess, logout,
    logoutAdmin, loadNotifications, subscribeToNotifications,
    showAuth, setShowAuth,
    showAdminAuth, setShowAdminAuth,
    showSecretAuth, setShowSecretAuth
  } = useAuthContext();

  // Hooks Customizados
  const { showInstallBtn, installApp, dismissInstall } = usePWA();

  const tabs = ['feed', 'profile', 'news', 'eventos', 'lugares', 'weather'];
  const currentIndex = tabs.indexOf(activeTab);

  // useSwipe e setTermsAccepted continuam aqui ou movemos para UIContext também? termos é global
  // Vamos manter termos aqui por enquanto para não quebrar muito
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { handleTouchStart, handleTouchEnd } = useSwipe(
    () => currentIndex < tabs.length - 1 && setActiveTab(tabs[currentIndex + 1]),
    () => currentIndex > 0 && setActiveTab(tabs[currentIndex - 1])
  );



  // Funções de navegação global — usadas por componentes filhos
  const openPublicProfile = useCallback((id) => {
    setPublicProfileId(id);
    setActiveTab('profile');
  }, [setPublicProfileId, setActiveTab]);

  const openChatWithUser = useCallback((id) => {
    setActiveTab('inbox');
    router.push({ pathname: '/', query: { ...router.query, tab: 'inbox', u: id } }, undefined, { shallow: true });
  }, [setActiveTab, router]);

  // Manter no window apenas para componentes legados que ainda dependem
  useEffect(() => {
    window.subscribeToPush = subscribeToNotifications;
    window.openPublicProfile = openPublicProfile;
    window.openAchievementList = (ach) => setAchievementToList(ach);
    window.openPhotoZoom = (photo) => setZoomedPhoto(photo);
    window.openChatWithUser = openChatWithUser;
  }, [subscribeToNotifications, openPublicProfile, openChatWithUser, setAchievementToList, setZoomedPhoto]);

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

  const handleDeclineTerms = () => alert("Você precisa aceitar os termos.");

  const openComments = useCallback(async (video) => {
    setCurrentVideo(video);
    setShowCommentsModal(true);
    await loadComments(video.id);
    if (user) {
      try { await viewVideo(video.id, user.id); } catch (e) { }
    }
  }, [loadComments, user]);

  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const success = await addComment(currentVideo.id, newComment);
    if (success) setNewComment("");
  };

  const canDelete = useCallback((ownerId) => {
    return isAdmin || (user && user.id.toString() === ownerId);
  }, [isAdmin, user]);

  // No servidor, começamos com um estado base para SEO
  const pageTitle = 'SINOPINHAS by SHURA';

  // Renderiza Head separadamente do mounted check para garantir SEO e PWA no servidor
  const headElement = (
    <Head>
      <title>{pageTitle}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="theme-color" content="#0E2A47" />
      <meta name="description" content="SINOPINHAS — A rede social de Sinop, MT. Compartilhe vídeos, fotos, notícias e eventos da cidade." />
      <meta property="og:title" content="SINOPINHAS by SHURA" />
      <meta property="og:description" content="A rede social de Sinop, MT. Compartilhe vídeos, fotos, notícias e eventos da cidade." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://sinopinhas.vercel.app" />
      <meta property="og:image" content="https://sinopinhas.vercel.app/icons/icon-512x512.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="SINOPINHAS by SHURA" />
      <meta name="twitter:description" content="A rede social de Sinop, MT." />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="SINOPINHAS by SHURA" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );

  if (!mounted) {
    return (
      <>
        {headElement}
        <div style={{ background: '#0f0d15', minHeight: '100vh' }} />
      </>
    );
  }

  if (!termsAccepted) {
    return (
      <>
        {headElement}
        {showTerms && <TermsModal onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />}
      </>
    );
  }

  return (
    <>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          minHeight: '100vh',
          background: 'var(--bg-gradient)',
          color: 'var(--text-color)',
          transition: 'all 0.3s ease'
        }}
      >
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        <Header
          user={user} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab}
          setShowAuth={setShowAuth} setShowSecretAuth={setShowSecretAuth} setShowAdminAuth={setShowAdminAuth}
          showSecretTab={showSecretTab} unreadCount={unreadCount} setShowProfile={setShowProfile}
          logout={() => { logout(); setActiveTab('feed'); }} logoutAdmin={logoutAdmin}
          theme={theme} toggleTheme={toggleTheme} setShowSupport={setShowSupport}
        />

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} showToast={showToast} />}
        {showProfile && <ProfileModal
          user={user}
          setUser={setUser}
          onClose={() => setShowProfile(false)}
          showToast={showToast}
          allowSecret={showSecretTab || isAdmin}
          onGoToSecret={() => { setActiveTab('secret'); setShowProfile(false); }}
          onRequestSecret={() => { setShowSecretAuth(true); setShowProfile(false); }}
          logout={() => { logout(); setShowProfile(false); setActiveTab('feed'); }}
        />}
        {showAdminAuth && <AdminAuthModal onClose={() => setShowAdminAuth(false)} onAdminAuthSuccess={handleAdminAuthSuccess} showToast={showToast} />}
        {showSecretAuth && <SecretAuthModal onClose={() => setShowSecretAuth(false)} onSecretAuthSuccess={() => { setShowSecretTab(true); setActiveTab('secret'); }} showToast={showToast} />}
        {showSupport && <SupportModal user={user} onClose={() => setShowSupport(false)} showToast={showToast} />}

        {/* PublicProfileModal removido pois agora é uma Aba */}

        {achievementToList && (
          <AchievementUsersModal
            achievement={achievementToList}
            onClose={() => setAchievementToList(null)}
            onUserClick={(id) => {
              setAchievementToList(null);
              setPublicProfileId(id);
              setActiveTab('profile'); // Switch to profile on click
            }}
          />
        )}

        {zoomedPhoto && (
          <PhotoZoomModal
            isOpen={!!zoomedPhoto}
            photoUrl={zoomedPhoto.video_url || zoomedPhoto.url}
            title={zoomedPhoto.title}
            onClose={() => setZoomedPhoto(null)}
          />
        )}

        <main className="main-content">
          <TabPane active={activeTab === 'feed'}>
            <HomeFeed user={user} isAdmin={isAdmin} adminPassword={adminPassword} onVideoClick={openComments} showToast={showToast} canDelete={canDelete} filterType="all" />
          </TabPane>

          <TabPane active={activeTab === 'profile'}>
            {publicProfileId ? (
              <ProfileFeed
                userId={publicProfileId}
                onAchievementClick={(ach) => setAchievementToList(ach)}
                onPostClick={openComments}
                onMessageClick={openChatWithUser}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 50, color: 'white' }}>Selecione um usuário para ver o perfil</div>
            )}
          </TabPane>

          <TabPane active={activeTab === 'news'}><NewsFeed /></TabPane>
          <TabPane active={activeTab === 'eventos'}><EventsSection /></TabPane>
          <TabPane active={activeTab === 'lugares'}><PlacesSection /></TabPane>
          <TabPane active={activeTab === 'weather'}><WeatherSection /></TabPane>

          {activeTab === 'secret' && <SecretFeed user={user} isAdmin={isAdmin} adminPassword={adminPassword} onVideoClick={openComments} showToast={showToast} canDelete={canDelete} />}
          {activeTab === 'upload' && <UploadSection user={user} setShowAuth={setShowAuth} showToast={showToast} setActiveTab={setActiveTab} />}
          {activeTab === 'inbox' && (user || isAdmin) && <Inbox user={user} API={API} isAdmin={isAdmin} adminPassword={adminPassword} onMessageRead={() => user && loadNotifications(user.id)} initialUserId={router.query.u} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel adminPassword={adminPassword} showToast={showToast} />}
        </main>

        <CommentsDrawer
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          video={currentVideo}
          comments={videoComments}
          user={user}
          newComment={newComment}
          setNewComment={setNewComment}
          onSend={sendComment}
          onDelete={(id) => removeComment(id, currentVideo.id)}
          canDelete={canDelete}
        />
      </div>

      <AnimatePresence>
        {showInstallBtn && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="pwa-prompt"
          >
            <div className="pwa-content">
              <div className="pwa-icon">📲</div>
              <div>
                <strong>Instalar Sinopinhas</strong>
                <p>Acesse mais rápido pela tela inicial</p>
              </div>
            </div>
            <div className="pwa-actions">
              <button onClick={dismissInstall} className="pwa-dismiss">Mais tarde</button>
              <button onClick={installApp} className="pwa-install">Instalar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        isAdmin={isAdmin}
        showSecretTab={showSecretTab}
      />

      <style jsx global>{`
        body { padding-bottom: 80px; }
        
        .pwa-prompt {
          position: fixed;
          bottom: 100px;
          left: 16px;
          right: 16px;
          background: linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%);
          padding: 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          z-index: 8999;
          color: white;
        }

        .pwa-content { display: flex; gap: 12px; align-items: center; }
        .pwa-icon { font-size: 24px; }
        .pwa-content strong { display: block; font-size: 14px; }
        .pwa-content p { font-size: 12px; opacity: 0.8; margin: 2px 0 0; }
        .pwa-actions { display: flex; gap: 8px; }
        .pwa-dismiss { background: none; border: none; color: white; font-size: 13px; cursor: pointer; padding: 8px; }
        .pwa-install { background: white; border: none; color: var(--accent-color); padding: 8px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; }

        @media (min-width: 769px) {
          body { padding-bottom: 0; }
          .pwa-prompt { display: none; }
        }
      `}</style>
    </>
  );
}
