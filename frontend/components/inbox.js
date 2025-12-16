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

  // Estados de Admin
  const [showAdminInbox, setShowAdminInbox] = useState(false);
  const [sendAsAdmin, setSendAsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadAllUsers();
    }
  }, [user, showAdminInbox]); // Reload when mode changes

  const loadAllUsers = async () => {
    try {
      setUsersLoading(true);
      if (!usersList || usersList.length === 0) {
        const res = await api.get(`/api/users/all`);
        setLocalUsersList(res.data);
      } else {
        setLocalUsersList(usersList);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // --- Carregamento de Mensagens ---
  const loadMessages = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let res;
      if (showAdminInbox && isAdmin) {
        res = await api.get(`/api/admin/inbox`);
      } else {
        res = await api.get(`/api/inbox/${user.id}`);
      }
      setMessages(res.data);
      if (onMessageRead) onMessageRead();
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Envio de Mensagem ---
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await api.post(`/api/send-message`, {
        from_id: user.id,
        to_id: selectedUser.id,
        msg: newMessage,
        is_admin: sendAsAdmin
        // removed admin_password
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  // Lógica de Filtragem (Admin vê tudo ou filtra por usuário)

  const filteredMessages = selectedUser
    ? messages.filter(m =>
      showAdminInbox
        ? (m.from_id === selectedUser.id || m.to_id === selectedUser.id)
        : ((m.from_id === user.id && m.to_id === selectedUser.id) || (m.from_id === selectedUser.id && m.to_id === user.id))
    )
    : [];

  const usersToShow = localUsersList.filter(u => u.id !== user?.id);

  if (!user) {
    return ( /* ... login prompt ... */
      <div style={{ textAlign: 'center', padding: 80, background: '#1a1a1a', borderRadius: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: '#fff', marginBottom: 10 }}>Faça login para acessar mensagens</h2>
        <p style={{ color: '#aaa' }}>Entre na sua conta para enviar e receber mensagens</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: '70vh', flexWrap: 'wrap' }}>
      {/* Lista de usuários */}
      <div style={{
        width: '300px',
        minWidth: '280px',
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        overflowY: 'auto',
        flex: '0 0 300px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#fff' }}>💬 Conversas</h3>
          {isAdmin && (
            <button
              onClick={() => setShowAdminInbox(!showAdminInbox)}
              style={{
                fontSize: 10,
                padding: '4px 8px',
                background: showAdminInbox ? '#ef4444' : '#333',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {showAdminInbox ? 'SAIR ADMIN' : 'ADMIN VIEW'}
            </button>
          )}
        </div>

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ width: 30, height: 30, border: '3px solid #303030', borderTop: '3px solid #8d6aff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : usersToShow.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 15 }}>👥</div>
            <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>Nenhum outro usuário no sistema ainda</p>
          </div>
        ) : (
          usersToShow.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              style={{
                padding: 12,
                marginBottom: 8,
                background: selectedUser?.id === u.id ? '#8d6aff' : '#2a2a2a',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: selectedUser?.id === u.id && showAdminInbox ? '2px solid #ef4444' : 'none'
              }}
            >
              {u.avatar ? (
                <img src={u.avatar} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} alt={u.username} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8d6aff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{u.username}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Área de conversa */}
      <div style={{
        flex: 1,
        minWidth: '300px',
        background: '#1a1a1a',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: showAdminInbox ? '2px solid #ef4444' : 'none'
      }}>
        {selectedUser ? (
          <>
            {/* Header da conversa */}
            <div style={{ padding: 20, borderBottom: '2px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 12, background: showAdminInbox ? '#2a0000' : 'transparent' }}>
              {selectedUser.avatar ? (
                <img src={selectedUser.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt={selectedUser.username} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8d6aff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold' }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>{selectedUser.username} {showAdminInbox && <span style={{ fontSize: 12, color: '#ef4444' }}>(Modo Espião)</span>}</h3>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #303030', borderTop: '4px solid #8d6aff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
                  <p>Nenhuma mensagem nesta conversa.</p>
                </div>
              ) : (
                filteredMessages.map((msg, i) => {
                  const isFromMe = msg.from_id === user.id;
                  const isFromSelected = msg.from_id === selectedUser.id;

                  // In Admin Mode, align: Me->Right, Selected->Left, Others->Center?
                  // If Admin Mode: Show everything linear with clear "From -> To" headers if confused.
                  // Simple logic:
                  // If standard mode: Me=Right, Other=Left.
                  // If admin mode: 
                  // If msg.from_id === user.id => Right.
                  // Else => Left.

                  // Admin Badge logic
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: showAdminInbox
                          ? (msg.from_id === user.id ? 'flex-end' : 'flex-start')
                          : (isFromMe ? 'flex-end' : 'flex-start'),
                        maxWidth: '70%',
                        position: 'relative'
                      }}
                    >
                      {showAdminInbox && (
                        <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>
                          {msg.from_username} → {msg.to_username}
                        </div>
                      )}
                      <div style={{
                        background: msg.is_admin ? '#ef4444' : (isFromMe ? '#8d6aff' : '#2a2a2a'),
                        padding: '10px 14px',
                        borderRadius: '16px',
                        color: '#fff',
                        border: showAdminInbox && msg.from_id !== user.id && msg.to_id !== user.id ? '1px dashed #666' : 'none'
                      }}>
                        {msg.is_admin && <strong style={{ display: 'block', fontSize: 10, color: '#ffd700', marginBottom: 4 }}>ADMIN OFICIAL</strong>}
                        <p style={{ margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {msg.msg.split(/\[VIDEO_LINK:(\d+)\]/g).map((part, idx) => {
                            if (idx % 2 === 1) { // It's a video ID capture group
                              const videoId = part;
                              return (
                                <a
                                  key={idx}
                                  href={`/?v=${videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'block', margin: '8px 0', padding: '10px',
                                    background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                                    textDecoration: 'none', color: '#8d6aff', fontWeight: 'bold',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                  }}
                                >
                                  ▶️ Assistir Vídeo #{videoId}
                                </a>
                              );
                            }
                            return part;
                          })}
                        </p>
                        <div style={{ fontSize: 11, color: isFromMe ? '#e0d5ff' : '#888', marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input de mensagem */}
            <form onSubmit={sendMessage} style={{ padding: 20, borderTop: '2px solid #2a2a2a', display: 'flex', gap: 10, flexDirection: 'column' }}>
              {isAdmin && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: sendAsAdmin ? '#ef4444' : '#aaa', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendAsAdmin}
                    onChange={e => setSendAsAdmin(e.target.checked)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  Enviar como Administrador
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={sendAsAdmin ? "Enviar mensagem oficial..." : "Digite sua mensagem..."}
                  style={{
                    flex: 1,
                    padding: 12,
                    background: '#2a2a2a',
                    border: sendAsAdmin ? '1px solid #ef4444' : 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 15,
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 24px',
                    background: newMessage.trim() ? (sendAsAdmin ? '#ef4444' : '#8d6aff') : '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {sendAsAdmin ? 'ANUNCIAR' : 'Enviar'} 📤
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 64 }}>💬</div>
            <h3 style={{ margin: 0 }}>Selecione um usuário</h3>
            {showAdminInbox && <p style={{ color: '#ef4444' }}>MODO ADMIN ATIVADO: Veja todas as conversas</p>}
          </div>
        )}
      </div>
    </div>
  );
}
