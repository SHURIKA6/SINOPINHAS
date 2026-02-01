import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
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

import {
  logTermsAcceptance,
  viewVideo
} from '../services/api';

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

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const router = useRouter();
  const [activeTab, setActiveTabState] = useState('feed');

  // Hooks Customizados
  const { showInstallBtn, installApp, dismissInstall } = usePWA();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const {
    user, setUser, isAdmin, adminPassword, unreadCount,
    handleAuthSuccess, handleAdminAuthSuccess, logout,
    logoutAdmin, loadNotifications, subscribeToNotifications
  } = useAuth(showToast);

  const tabs = ['feed', 'news', 'eventos', 'lugares', 'weather'];
  const currentIndex = tabs.indexOf(activeTab);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    router.push({
      pathname: '/',
      query: { ...router.query, tab: tab }
    }, undefined, { shallow: true });
  };

  const { handleTouchStart, handleTouchEnd } = useSwipe(
    () => currentIndex < tabs.length - 1 && setActiveTab(tabs[currentIndex + 1]),
    () => currentIndex > 0 && setActiveTab(tabs[currentIndex - 1])
  );

  // Sincroniza estado com a URL
  useEffect(() => {
    if (router.isReady) {
      const tab = router.query.tab;
      if (tab && ['feed', 'upload', 'eventos', 'news', 'lugares', 'weather', 'admin', 'inbox', 'secret'].includes(tab)) {
        setActiveTabState(tab);
      }
    }
  }, [router.isReady, router.query.tab]);

  const [showSecretAuth, setShowSecretAuth] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSecretTab, setShowSecretTab] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Perfil Público e Conquistas
  const [publicProfileId, setPublicProfileId] = useState(null);
  const [achievementToList, setAchievementToList] = useState(null);

  // Troca de Tema
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    window.subscribeToPush = subscribeToNotifications;
    window.openPublicProfile = (id) => setPublicProfileId(id);
    window.openAchievementList = (ach) => setAchievementToList(ach);
    window.openPhotoZoom = (photo) => setZoomedPhoto(photo);
    window.openChatWithUser = (id) => {
      setActiveTab('inbox');
      // Precisa passar o ID para o componente Inbox de alguma forma, 
      // mas como ele é um filho do TabPane, podemos usar router query.
      router.push({ pathname: '/', query: { ...router.query, tab: 'inbox', u: id } }, undefined, { shallow: true });
    };
  }, [subscribeToNotifications, router]);

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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <meta name="theme-color" content="#0f0d15" />
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
          logout={() => { logout(); setShowProfile(false); setActiveTab('feed'); }}
        />}
        {showAdminAuth && <AdminAuthModal onClose={() => setShowAdminAuth(false)} onAdminAuthSuccess={handleAdminAuthSuccess} showToast={showToast} />}
        {showSecretAuth && <SecretAuthModal onClose={() => setShowSecretAuth(false)} onSecretAuthSuccess={() => { setShowSecretTab(true); setActiveTab('secret'); }} showToast={showToast} />}
        {showSupport && <SupportModal user={user} onClose={() => setShowSupport(false)} showToast={showToast} />}

        {publicProfileId && (
          <PublicProfileModal
            userId={publicProfileId}
            onClose={() => setPublicProfileId(null)}
            onAchievementClick={(ach) => setAchievementToList(ach)}
          />
        )}

        {achievementToList && (
          <AchievementUsersModal
            achievement={achievementToList}
            onClose={() => setAchievementToList(null)}
            onUserClick={(id) => {
              setAchievementToList(null);
              setPublicProfileId(id);
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
