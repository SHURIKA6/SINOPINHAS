import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Inbox({ user, usersList }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMessages = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/inbox/${user.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
      showToast('Erro ao carregar mensagens da caixa de entrada.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    if (!user) return;
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!recipientId || !newMessage.trim()) {
      return showToast('Selecione um destinatário e digite uma mensagem.', 'error');
    }
    try {
      await axios.post(`${API}/api/send-message`, {
        from_id: user.id,
        to_id: parseInt(recipientId),
        msg: newMessage.trim()
      });
      setNewMessage("");
      setRecipientId("");
      loadMessages();
      showToast('Mensagem enviada!', 'success');
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      showToast('Falha ao enviar mensagem privada.', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#666' }}>
        Faça login para acessar suas mensagens.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px 20px',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          {toast.message}
        </div>
      )}

      <h2 style={{ marginBottom: '30px' }}>📬 Mensagens Privadas</h2>

      <form onSubmit={sendMessage} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Para:</label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px' }}>
            <option value="">Selecione um usuário...</option>
            {usersList && usersList.filter(u => u.id !== user.id).map(u => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mensagem:</label>
          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." rows="4" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px', resize: 'vertical' }} />
        </div>

        <button type="submit" style={{ backgroundColor: '#2196F3', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>✉️ Enviar Mensagem</button>
      </form>

      <div>
        <h3 style={{ marginBottom: '20px' }}>Caixa de Entrada</h3>
        {loading ? (
          <p>Carregando mensagens...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Você não tem mensagens. Use o formulário acima para enviar uma.</p>
        ) : (
          <div>
            {messages.map((m, index) => (
              <div key={index} style={{ backgroundColor: m.from_id === user.id ? '#e3f2fd' : '#fff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  <strong>{m.from_id === user.id ? `Para: ${m.to_username || 'Usuário'}` : `De: ${m.from_username || 'Usuário'}`}</strong>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '16px' }}>{m.msg}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
