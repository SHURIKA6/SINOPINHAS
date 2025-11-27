import { useState, useEffect } from "react";
import axios from "axios";

// Defina a URL do seu backend no .env.local
const API = process.env.NEXT_PUBLIC_API_URL;

export default function Inbox({ user, usersList }) { // Recebe o usuário logado e a lista de usuários para "To"
  
  // --- ESTADOS ---
  const [messages, setMessages] = useState([]); // Armazena mensagens recebidas/enviadas
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState(""); // ID do destinatário (to_id)
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // Usamos o toast da Home para consistência

  // Se o usuário não estiver logado, não renderizamos nada
  if (!user) return <p style={{ textAlign: 'center', color: '#fff', marginTop: 40 }}>Faça login para acessar suas mensagens.</p>;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- FUNÇÕES DE LÓGICA CORE ---

  // 1. Carregar Mensagens
  const loadMessages = async () => {
    try {
      setLoading(true);
      // Rota de busca no Worker: GET /api/inbox/:user_id
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
    // Atualiza a cada 30 segundos (simulação de tempo real)
    const interval = setInterval(loadMessages, 30000); 
    return () => clearInterval(interval);
  }, [user.id]);


  // 2. Enviar Mensagem
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
      loadMessages(); // Recarrega para ver a nova mensagem
      showToast('Mensagem enviada!', 'success');
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      showToast('Falha ao enviar mensagem privada.', 'error');
    }
  };

  // --- RENDERIZAÇÃO DA UI ---

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#1a1a1a", borderRadius: 16, padding: 30, color: "#fff" }}>
      <h2>📥 Minha Caixa de Entrada</h2>
      
      {/* Exibir Toast, se houver */}
      {toast && <div style={{ marginBottom: 20, color: toast.type === 'success' ? 'green' : 'red' }}>{toast.message}</div>}

      {/* Formulário de Envio */}
      <form onSubmit={sendMessage} style={{ marginBottom: 30, padding: 20, border: '1px solid #333', borderRadius: 10 }}>
        <h4>Enviar Nova Mensagem</h4>
        <select
          value={recipientId}
          onChange={e => setRecipientId(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 15, background: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: 8 }}
        >
          <option value="" disabled>Selecione o destinatário</option>
          {usersList.map(u => (
            // Impede de enviar para si mesmo (se a lista de usuários estiver disponível)
            u.id !== user.id && <option key={u.id} value={u.id}>{u.username}</option> 
          ))}
        </select>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows="3"
          style={{ width: '100%', padding: 10, marginBottom: 15, background: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: 8 }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#8d6aff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Enviar Mensagem
        </button>
      </form>

      {/* Lista de Mensagens */}
      <h4>Conversas Recentes ({loading ? 'Carregando...' : messages.length})</h4>
      {messages.length === 0 ? (
        <p style={{ color: '#aaa' }}>Você não tem mensagens. Use o formulário acima para enviar uma.</p>
      ) : (
        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                background: m.from_id === user.id ? '#333' : '#4a2f7c', // Diferencia mensagens enviadas/recebidas
                padding: 15,
                marginBottom: 10,
                borderRadius: 10,
                border: m.to_id === user.id ? '1px solid #8d6aff' : 'none' 
              }}
            >
              <div style={{ fontWeight: 'bold', color: m.from_id === user.id ? '#10b981' : '#fff' }}>
                 {m.from_id === user.id ? `Eu (Para ID: ${m.to_id})` : `De ID: ${m.from_id}`}
              </div>
              <p style={{ margin: '5px 0 0' }}>{m.msg}</p>
              <small style={{ color: '#aaa', fontSize: 12 }}>{new Date(m.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}