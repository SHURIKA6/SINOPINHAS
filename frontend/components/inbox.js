import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react';

const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL;

export default function Inbox({ user, usersList, onMessageRead, API = DEFAULT_API, isAdmin = false, adminPassword = '', initialUserId = null }) {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [localUsersList, setLocalUsersList] = useState([]);

  const [showAdminInbox, setShowAdminInbox] = useState(false);
  const [sendAsAdmin, setSendAsAdmin] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user || isAdmin) {
      if (isAdmin && !user) {
        setShowAdminInbox(true);
      }
      loadMessages();
      loadAllUsers();
    }
  }, [user, isAdmin, showAdminInbox]);

  // Auto-selecionar usuário se vier por parâmetro
  useEffect(() => {
    if (initialUserId && localUsersList.length > 0) {
      const u = localUsersList.find(u => u.id.toString() === initialUserId.toString());
      if (u) setSelectedUser(u);
    }
  }, [initialUserId, localUsersList]);

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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        is_admin: sendAsAdmin,
        admin_password: adminPassword
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
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filtrar usuários para inbox (apenas com quem houve interação ou todos se quiser uma lista completa)
  // No original, parecia listar todos. Vamos manter, mas talvez filtrar admin?
  // O código original filtrava apenas o próprio usuário:
  const inboxUsers = localUsersList.filter(u => u.id !== user?.id);

  if (!user && !isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? '40px 20px' : 80, background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: 'var(--text-color)', marginBottom: 10 }}>Faça login para acessar mensagens</h2>
        <p style={{ color: 'var(--secondary-text)' }}>Entre na sua conta para enviar e receber mensagens</p>
      </div>
    );
  }

  // --- MSN LAYOUT ---
  return (
    <div className="msn-container" style={{ padding: '20px', display: 'flex', justifyContent: 'center', height: '100%' }}>
      <div className="msn-window" style={{ width: '100%', maxWidth: '900px', height: isMobile ? 'calc(100vh - 150px)' : '600px' }}>

        {/* SIDEBAR (Contacts) */}
        {(!isMobile || !selectedUser) && (
          <div className={`msn-sidebar ${isMobile ? 'w-full' : ''}`} style={{ width: isMobile ? '100%' : '300px' }}>
            <div className="msn-header">
              <span style={{ fontWeight: 'bold', color: '#444' }}>Conversas {isAdmin && '(Admin)'}</span>
              {isAdmin && (
                <button
                  onClick={() => setShowAdminInbox(!showAdminInbox)}
                  style={{ fontSize: 10, padding: '2px 6px', background: showAdminInbox ? 'red' : '#ddd', color: 'white', borderRadius: 4, border: 'none' }}
                >
                  {showAdminInbox ? 'Spy Mode ON' : 'Spy OFF'}
                </button>
              )}
            </div>

            <div className="msn-user-bar">
              <div className="msn-avatar-frame">
                <img
                  src={user?.avatar || 'https://www.gravatar.com/avatar?d=mp'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={user?.username || 'Me'}
                />
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 'bold', color: '#000' }}>{user?.username}</span> <br />
                <span style={{ color: '#008000', fontSize: '11px' }}>(Online)</span>
              </div>
            </div>

            <div className="msn-contact-list">
              {usersLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Carregando contatos...</div>
              ) : inboxUsers.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Nenhum contato online</div>
              ) : (
                inboxUsers.map(u => {
                  const unreadCount = messages.filter(m => m.from_id === u.id && m.to_id === user?.id && !m.is_read).length;
                  return (
                    <div
                      key={u.id}
                      className={`msn-contact ${selectedUser?.id === u.id ? 'active' : ''}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="msn-avatar-frame" style={{ width: '32px', height: '32px' }}>
                        <img src={u.avatar || 'https://www.gravatar.com/avatar?d=mp'} style={{ width: '100%', height: '100%' }} alt={u.username} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>{u.username}</span>
                        <span style={{ fontSize: '10px', color: '#666' }}>
                          {unreadCount > 0 ? `(${unreadCount} nova(s) msg)` : 'Disponível'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CHAT AREA */}
        {(!isMobile || selectedUser) && (
          <div className="msn-chat-area">
            {selectedUser ? (
              <>
                <div className="msn-chat-header">
                  {isMobile && (
                    <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>
                      <ArrowLeft size={20} color="#444" />
                    </button>
                  )}
                  <div className="msn-avatar-frame">
                    <img src={selectedUser.avatar || 'https://www.gravatar.com/avatar?d=mp'} style={{ width: '100%', height: '100%' }} alt="Buddy" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#000' }}>{selectedUser.username}</span>
                    <span style={{ fontSize: '11px', color: '#555' }}>&lt; Digite uma mensagem... &gt;</span>
                  </div>
                </div>

                <div className="msn-messages-box">
                  {loading && messages.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center' }}>Carregando...</div>
                  ) : filteredMessages.map((msg, idx) => {
                    const isMe = user && msg.from_id === user.id;
                    return (
                      <div key={idx} style={{ marginBottom: '4px', color: isMe ? '#000' : '#000080' }}>
                        <span style={{ color: '#888', marginRight: '4px', fontSize: '11px' }}>
                          [{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                        </span>
                        <span style={{ fontWeight: 'bold' }}>{isMe ? user.username : selectedUser.username}: </span>
                        <span>{msg.msg}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="msn-input-area">
                  <div className="msn-tools">
                    <Send size={14} color="#666" /> <Paperclip size={14} color="#666" /> <Smile size={14} color="#666" />
                  </div>
                  <textarea
                    className="msn-textarea"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    {isAdmin && (
                      <label style={{ fontSize: 10, display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" checked={sendAsAdmin} onChange={e => setSendAsAdmin(e.target.checked)} /> Admin Mode
                      </label>
                    )}
                    <button type="submit" className="msn-send-btn" disabled={!newMessage.trim()}>Enviar</button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F8FF', flexDirection: 'column' }}>
                <div style={{ fontSize: 40, opacity: 0.3 }}>🦋</div>
                <p style={{ color: '#666', marginTop: '10px' }}>Selecione um contato para conversar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
