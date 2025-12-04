import { useEffect, useState } from 'react';
import axios from 'axios';

const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL;

export default function Inbox({ user, usersList, onMessageRead, API = DEFAULT_API }) {
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [localUsersList, setLocalUsersList] = useState([]);

  useEffect(() => {
    if (user) {
      loadMessages();
      loadAllUsers();
    }
  }, [user]);

  const loadAllUsers = async () => {
    try {
      setUsersLoading(true);
      // Se não tiver usersList, buscar direto do backend
      if (!usersList || usersList.length === 0) {
        const res = await axios.get(`${API}/api/users/all`);
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

  const loadMessages = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/inbox/${user.id}`);
      setMessages(res.data);
      if (onMessageRead) onMessageRead();
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await axios.post(`${API}/api/send-message`, {
        from_id: user.id,
        to_id: selectedUser.id,
        msg: newMessage
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const filteredMessages = selectedUser
    ? messages.filter(m => 
        (m.from_id === user.id && m.to_id === selectedUser.id) ||
        (m.from_id === selectedUser.id && m.to_id === user.id)
      )
    : [];

  const usersToShow = localUsersList.filter(u => u.id !== user?.id);

  if (!user) {
    return (
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
        <h3 style={{ margin: '0 0 20px', color: '#fff' }}>💬 Conversas</h3>
        
        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ 
              width: 30, 
              height: 30, 
              border: '3px solid #303030', 
              borderTop: '3px solid #8d6aff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
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
                gap: 10
              }}
              onMouseEnter={(e) => {
                if (selectedUser?.id !== u.id) {
                  e.currentTarget.style.background = '#353535';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedUser?.id !== u.id) {
                  e.currentTarget.style.background = '#2a2a2a';
                }
              }}
            >
              {u.avatar ? (
                <img 
                  src={u.avatar} 
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  alt={u.username}
                />
              ) : (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#8d6aff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  {u.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{u.username}</div>
                {u.bio && (
                  <div style={{ fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.bio}
                  </div>
                )}
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
        overflow: 'hidden'
      }}>
        {selectedUser ? (
          <>
            {/* Header da conversa */}
            <div style={{ 
              padding: 20, 
              borderBottom: '2px solid #2a2a2a',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              {selectedUser.avatar ? (
                <img 
                  src={selectedUser.avatar} 
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  alt={selectedUser.username}
                />
              ) : (
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#8d6aff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 'bold'
                }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>{selectedUser.username}</h3>
                {selectedUser.bio && (
                  <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>{selectedUser.bio}</p>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ 
              flex: 1, 
              padding: 20, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    border: '4px solid #303030', 
                    borderTop: '4px solid #8d6aff', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }} />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>💬</div>
                  <p>Nenhuma mensagem ainda</p>
                  <p style={{ fontSize: 14 }}>Seja o primeiro a enviar uma mensagem!</p>
                </div>
              ) : (
                filteredMessages.map((msg, i) => {
                  const isFromMe = msg.from_id === user.id;
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}
                    >
                      <div style={{
                        background: isFromMe ? '#8d6aff' : '#2a2a2a',
                        padding: '10px 14px',
                        borderRadius: isFromMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        color: '#fff'
                      }}>
                        <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.msg}</p>
                        <div style={{ 
                          fontSize: 11, 
                          color: isFromMe ? '#e0d5ff' : '#888',
                          marginTop: 4,
                          textAlign: 'right'
                        }}>
                          {new Date(msg.created_at).toLocaleString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input de mensagem */}
            <form onSubmit={sendMessage} style={{ 
              padding: 20, 
              borderTop: '2px solid #2a2a2a',
              display: 'flex',
              gap: 10
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#2a2a2a',
                  border: 'none',
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
                  background: newMessage.trim() ? '#8d6aff' : '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Enviar 📤
              </button>
            </form>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: '#aaa',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ fontSize: 64 }}>💬</div>
            <h3 style={{ margin: 0 }}>Selecione um usuário</h3>
            <p style={{ margin: 0, fontSize: 14 }}>Escolha uma conversa para começar a enviar mensagens</p>
          </div>
        )}
      </div>
    </div>
  );
}
