import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL;

export default function Inbox({ user, usersList, onMessageRead, API = DEFAULT_API, isAdmin = false, adminPassword = '' }) {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [localUsersList, setLocalUsersList] = useState([]);

  const [showAdminInbox, setShowAdminInbox] = useState(false);
  const [sendAsAdmin, setSendAsAdmin] = useState(false);

  useEffect(() => {
    if (user || isAdmin) {
      if (isAdmin && !user) {
        setShowAdminInbox(true);
      }
      loadMessages();
      loadAllUsers();
    }
  }, [user, isAdmin, showAdminInbox]);

  // Carregar lista de usuários
  const loadAllUsers = async () => {
    try {
      setUsersLoading(true);
      if (!usersList || usersList.length === 0) {
        const res = await api.get(`/api/users/all`);
        setLocalUsersList(res.data);
      } else {
        setLocalUsersList(usersList);
      }
    } catch (err) { }
    finally { setUsersLoading(false); }
  };

  // Marcar como lido
  const markMessagesAsRead = async () => {
    if (!selectedUser || !user) return;
    try {
      await api.post(`/api/conversations/${selectedUser.id}/read`, { userId: user.id });
      if (onMessageRead) onMessageRead();
    } catch (err) { }
  };

  useEffect(() => {
    if (selectedUser) markMessagesAsRead();
  }, [selectedUser]);

  // Carregar mensagens
  const loadMessages = async () => {
    if (!user && !isAdmin) return;
    try {
      setLoading(true);
      let res;
      if (showAdminInbox && isAdmin) {
        res = await api.get(`/api/admin/inbox`);
      } else if (user) {
        res = await api.get(`/api/inbox/${user.id}`);
      } else {
        return; // Caso admin mas sem modo admin view ativo e sem usuário
      }
      setMessages(res.data);
    } catch (err) { }
    finally { setLoading(false); }
  };

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    if (!user && !sendAsAdmin) {
      alert("Para enviar mensagens normais, você precisa estar logado como usuário.");
      return;
    }

    try {
      await api.post(`/api/send-message`, {
        from_id: user?.id || 0,
        to_id: selectedUser.id,
        msg: newMessage,
        is_admin: sendAsAdmin
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) { }
  };

  const filteredMessages = selectedUser
    ? messages.filter(m =>
      showAdminInbox
        ? (m.from_id === selectedUser.id || m.to_id === selectedUser.id)
        : (user && ((m.from_id === user.id && m.to_id === selectedUser.id) || (m.from_id === selectedUser.id && m.to_id === user.id)))
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Garante ordem cronológica
    : [];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const usersToShow = localUsersList.filter(u => u.id !== user?.id);

  if (!user && !isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : 80, background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: 'var(--text-color)', marginBottom: 10 }}>Faça login para acessar mensagens</h2>
        <p style={{ color: 'var(--secondary-text)' }}>Entre na sua conta para enviar e receber mensagens</p>
      </div>
    );
  }

  // Interface do Inbox
  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? 0 : 20,
      height: isMobile ? 'calc(100vh - 120px)' : '70vh',
      flexDirection: 'row',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-color)',
      borderRadius: 16
    }}>
      {/* LISTA DE USUÁRIOS */}
      <div style={{
        width: isMobile ? '100%' : '300px',
        display: (isMobile && selectedUser) ? 'none' : 'flex',
        flexDirection: 'column',
        background: 'var(--card-bg)',
        borderRadius: isMobile ? 0 : 12,
        padding: isMobile ? '15px' : 20,
        overflowY: 'auto',
        flex: isMobile ? '1' : '0 0 300px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: isMobile ? 18 : 22 }}>💬 Conversas</h3>
          {isAdmin && (
            <button onClick={() => setShowAdminInbox(!showAdminInbox)} style={{ fontSize: 10, padding: '4px 8px', background: showAdminInbox ? '#ef4444' : 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 4, color: 'white' }}>
              {showAdminInbox ? 'SAIR ADMIN' : 'ADMIN VIEW'}
            </button>
          )}
        </div>

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ width: 30, height: 30, border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : usersToShow.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 15 }}>👥</div>
            <p style={{ color: 'var(--secondary-text)', fontSize: 14, margin: 0 }}>Nenhum usuário online</p>
          </div>
        ) : (
          usersToShow.map(u => {
            const unreadCount = messages.filter(m => m.from_id === u.id && m.to_id === user?.id && !m.is_read).length;
            return (
              <div key={u.id} onClick={() => setSelectedUser(u)} style={{
                padding: '14px 12px',
                marginBottom: 8,
                background: selectedUser?.id === u.id ? 'var(--accent-color)' : 'var(--input-bg)',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: selectedUser?.id === u.id && showAdminInbox ? '2px solid #ef4444' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ position: 'relative' }}>
                  {u.avatar ?
                    <img src={u.avatar} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} alt={u.username} /> :
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' }}> {u.username.charAt(0).toUpperCase()} </div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: selectedUser?.id === u.id ? '#fff' : 'var(--text-color)', fontSize: 15 }}>{u.username}</div>
                  {user && unreadCount > 0 && <div style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', border: '2px solid var(--card-bg)' }}> {unreadCount} </div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ÁREA DA CONVERSA */}
      <div style={{
        flex: 1,
        display: (isMobile && !selectedUser) ? 'none' : 'flex',
        flexDirection: 'column',
        background: 'var(--card-bg)',
        borderRadius: isMobile ? 0 : 12,
        overflow: 'hidden',
        border: showAdminInbox ? '2px solid #ef4444' : '1px solid var(--border-color)',
        height: '100%'
      }}>
        {selectedUser ? (
          <>
            <div style={{ padding: isMobile ? '12px 15px' : '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12, background: showAdminInbox ? '#2a0000' : 'var(--card-bg)' }}>
              {isMobile && (
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-color)', fontSize: 24, padding: '0 10px 0 0', cursor: 'pointer' }}>
                  ←
                </button>
              )}
              {selectedUser.avatar ? <img src={selectedUser.avatar} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} alt={selectedUser.username} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}> {selectedUser.username.charAt(0).toUpperCase()} </div>}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: 'var(--text-color)', fontSize: 16 }}>{selectedUser.username}</h3>
                {showAdminInbox && <span style={{ fontSize: 10, color: '#ef4444' }}>Modo Espião</span>}
              </div>
            </div>

            <div style={{ flex: 1, padding: isMobile ? '15px' : '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 15, background: 'var(--bg-color)' }}>
              {loading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTop: '4px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
              ) : filteredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--secondary-text)', marginTop: 40, background: 'var(--card-bg)', padding: 20, borderRadius: 12 }}><p>Inicie uma conversa com {selectedUser.username}</p></div>
              ) : (
                filteredMessages.map((msg, i) => {
                  const isFromMe = user && msg.from_id === user.id;
                  const isFromSelectedUser = selectedUser && msg.from_id === selectedUser.id;

                  // No modo Admin/Espião, alinhamos o usuário "espionado" à direita para facilitar leitura
                  const alignRight = showAdminInbox ? isFromSelectedUser : isFromMe;
                  const senderName = msg.from_username || `Usuário ${msg.from_id}`;
                  const receiverName = msg.to_username || `Usuário ${msg.to_id}`;

                  return (
                    <div key={i} style={{ alignSelf: alignRight ? 'flex-end' : 'flex-start', maxWidth: isMobile ? '85%' : '75%', position: 'relative' }}>
                      {showAdminInbox && (
                        <div style={{ fontSize: 9, marginBottom: 2, opacity: 0.6, textAlign: alignRight ? 'right' : 'left', color: 'var(--text-color)' }}>
                          {alignRight ? `Para: ${receiverName}` : `De: ${senderName}`}
                        </div>
                      )}
                      <div style={{
                        background: msg.is_admin ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : (alignRight ? 'var(--accent-color)' : 'var(--card-bg)'),
                        padding: '10px 14px',
                        borderRadius: alignRight ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        color: (alignRight || msg.is_admin) ? '#fff' : 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {msg.is_admin && <strong style={{ display: 'block', fontSize: 9, color: '#ffd700', marginBottom: 4, textTransform: 'uppercase' }}>📢 Admin Oficial</strong>}
                        <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: '1.4' }}>
                          {msg.msg.split(/\[VIDEO_LINK:(\d+)\]/g).map((part, idx) => idx % 2 === 1 ? <span key={idx} style={{ display: 'block', margin: '8px 0', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: '#fff', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => window.open(`/?v=${part}`, '_blank')}>▶️ Ver Vídeo #{part}</span> : part)}
                        </p>
                        <div style={{ fontSize: 10, color: (isFromMe || msg.is_admin) ? 'rgba(255,255,255,0.7)' : 'var(--secondary-text)', marginTop: 6, textAlign: 'right' }}> {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendMessage} style={{ padding: isMobile ? '10px' : '15px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10, flexDirection: 'column', background: 'var(--card-bg)' }}>
              {isAdmin && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: sendAsAdmin ? '#ef4444' : 'var(--secondary-text)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={sendAsAdmin} onChange={e => setSendAsAdmin(e.target.checked)} /> Modo Admin
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'center' }}>
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Sua mensagem..." style={{ flex: 1, padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 25, color: 'var(--text-color)', fontSize: 14, outline: 'none' }} />
                <button type="submit" disabled={!newMessage.trim()} style={{
                  width: 44,
                  height: 44,
                  background: newMessage.trim() ? 'var(--accent-color)' : 'var(--input-bg)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s active'
                }}>
                  <span style={{ fontSize: 20 }}>{newMessage.trim() ? '↑' : '✉️'}</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--secondary-text)', flexDirection: 'column', gap: 15, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 64, opacity: 0.5 }}>💬</div>
            <h3 style={{ margin: 0, color: 'var(--text-color)' }}>Selecione um chat para começar</h3>
            <p style={{ fontSize: 14, maxWidth: 200 }}>Escolha uma das conversas ao lado</p>
          </div>
        )}
      </div>
    </div>
  );
}
