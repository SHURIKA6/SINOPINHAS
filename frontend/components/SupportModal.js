import { useState } from 'react';

export default function SupportModal({ user, onClose, showToast }) {
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason || !message) {
            return showToast('Preencha o motivo e a mensagem', 'error');
        }

        setLoading(true);
        try {
            const payload = {
                user_id: user?.id || 0,
                username: user?.username || 'Anônimo',
                reason,
                message
            };

            // Simula envio para o admin no banco (endpoint será criado no backend)
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend.fernandoriaddasilvaribeiro.workers.dev'}/api/support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Erro ao enviar chamado');

            showToast('Chamado enviado com sucesso!', 'success');

            // Ping para o WhatsApp
            const waMessage = `Olá Admin! Um novo chamado foi aberto no SINOPINHAS.%0A%0A👤 Usuário: ${user?.username || 'Anônimo'}%0A📌 Motivo: ${reason}%0A💬 Mensagem: ${message}`;
            const waUrl = `https://wa.me/5566999356646?text=${waMessage}`;

            window.open(waUrl, '_blank');

            onClose();
        } catch (err) {
            showToast(err.message || 'Erro ao processar suporte', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--card-bg)', borderRadius: 20, padding: 32,
                maxWidth: 500, width: '100%',
                border: '2px solid var(--accent-color)',
                boxShadow: '0 0 40px rgba(141, 106, 255, 0.3)',
                color: 'var(--text-color)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 800, background: 'linear-gradient(90deg, #8d6aff, #fe7d45)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    🆘 Suporte / Chamado
                </h2>
                <p style={{ color: 'var(--secondary-text)', fontSize: 14, marginBottom: 24 }}>
                    Explique o que aconteceu e nós entraremos em contato.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Motivo do Contato</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            style={{ width: '100%', padding: 12, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-color)', fontSize: 15, outline: 'none' }}
                        >
                            <option value="">Selecione um motivo...</option>
                            <option value="Erro no Site">Bug / Erro no Site</option>
                            <option value="Problema no Login">Problema no Login/Senha</option>
                            <option value="Denúncia de Conteúdo">Denúncia de Vídeo/Foto</option>
                            <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
                            <option value="Outro">Outro Motivo</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Descrição Detalhada</label>
                        <textarea
                            placeholder="Descreva aqui o que está acontecendo..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows="5"
                            style={{ width: '100%', padding: 12, background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-color)', fontSize: 15, resize: 'none', outline: 'none' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: 14,
                            background: 'linear-gradient(135deg, var(--accent-color) 0%, #6040e6 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 16,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(141, 106, 255, 0.4)'
                        }}
                    >
                        {loading ? 'Enviando...' : '🚀 Abrir Chamado e Confirmar no WhatsApp'}
                    </button>
                </form>

                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', fontSize: 20 }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
