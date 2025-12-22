import { useState, useEffect } from 'react';
import { fetchUsers, fetchLogs, resetUserPassword, banUser, toggleUserRole, fetchAllShuraMessages, toggleApproveShuraMessage, deleteShuraMessage } from '../../services/api';

export default function AdminPanel({ adminPassword, showToast }) {
    const [usersList, setUsersList] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [shuraMessages, setShuraMessages] = useState([]);
    const [loadingShura, setLoadingShura] = useState(false);

    useEffect(() => {
        loadUsers();
        loadLogs();
        loadShuraMessages();
    }, [adminPassword]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await fetchUsers();
            setUsersList(data);
        } catch (err) {
            if (err.status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
            } else {
                showToast(err.message || 'Erro ao carregar usuários', 'error');
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadLogs = async () => {
        try {
            setLoadingLogs(true);
            const data = await fetchLogs();
            setLogs(data);
        } catch (err) {
            if (err.status === 401) return;
            showToast(err.message || 'Erro ao buscar registros', 'error');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleResetPassword = async (userId) => {
        if (!confirm('Resetar a senha deste usuário para "123456"?')) return;
        try {
            await resetUserPassword(userId, adminPassword);
            showToast('Senha alterada para 123456', 'success');
        } catch (err) { showToast(err.message || 'Erro ao resetar', 'error'); }
    };

    const handleBanUser = async (userId) => {
        if (!confirm('TEM CERTEZA? Isso apaga o usuário e TODOS os vídeos dele!')) return;
        try {
            await banUser(userId, adminPassword);
            showToast('Usuário banido/apagado!', 'success');
            loadUsers();
        } catch (err) { showToast(err.message || 'Erro ao banir', 'error'); }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const msg = newRole === 'admin' ? 'Promover este usuário a ADMIN?' : 'Remover privilégios de ADMIN deste usuário?';
        if (!confirm(msg)) return;

        try {
            await toggleUserRole(userId, newRole);
            showToast(`Usuário ${newRole === 'admin' ? 'promovido' : 'rebaixado'} com sucesso!`, 'success');
            loadUsers();
        } catch (err) {
            showToast(err.message || 'Erro ao alterar cargo', 'error');
        }
    };

    const loadShuraMessages = async () => {
        try {
            setLoadingShura(true);
            const res = await fetchAllShuraMessages();
            setShuraMessages(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingShura(false);
        }
    };

    const handleToggleShuraApproval = async (msgId, currentStatus) => {
        try {
            await toggleApproveShuraMessage(msgId, !currentStatus);
            showToast(currentStatus ? 'Mensagem ocultada do log' : 'Mensagem aprovada!', 'success');
            loadShuraMessages();
        } catch (err) {
            showToast('Erro ao atualizar status', 'error');
        }
    };

    const handleDeleteShuraMessage = async (msgId) => {
        if (!confirm('Deletar permanentemente esta mensagem?')) return;
        try {
            await deleteShuraMessage(msgId);
            showToast('Mensagem deletada', 'success');
            loadShuraMessages();
        } catch (err) {
            showToast('Erro ao deletar', 'error');
        }
    };

    return (
        <div style={{ color: 'var(--text-color)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>🛡️ Painel Admin</h2>

            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, margin: 0 }}>👥 Usuários Cadastrados ({usersList.length})</h3>
                    <button
                        onClick={loadUsers}
                        disabled={loadingUsers}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loadingUsers ? '⏳' : '🔃'} Atualizar Usuários
                    </button>
                </div>
                <div style={{ background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--input-bg)' }}>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Cargo</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: 12 }}>#{u.id}</td>
                                    <td style={{ padding: 12 }}>{u.username}</td>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            background: u.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: u.role === 'admin' ? '#10b981' : 'inherit',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {u.role || 'user'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleToggleRole(u.id, u.role)} style={{
                                            padding: '6px 12px',
                                            background: u.role === 'admin' ? '#6366f1' : '#8b5cf6',
                                            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13
                                        }}>
                                            {u.role === 'admin' ? 'Tirar Admin' : 'Dar Admin'}
                                        </button>
                                        <button onClick={() => handleResetPassword(u.id)} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                                            Resetar Senha
                                        </button>
                                        <button onClick={() => handleBanUser(u.id)} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                                            Banir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, margin: 0 }}>⌨️ Shura Logs: Mensagens da Comunidade</h3>
                    <button
                        onClick={loadShuraMessages}
                        disabled={loadingShura}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    >
                        {loadingShura ? '⏳' : '🔃'} Atualizar
                    </button>
                </div>
                <div style={{ background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--input-bg)' }}>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Mensagem</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shuraMessages.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>Nenhuma mensagem enviada ainda.</td></tr>
                            ) : shuraMessages.map((m) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: 12, fontWeight: 'bold' }}>{m.username}</td>
                                    <td style={{ padding: 12, fontSize: 13, maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>{m.message}</td>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            background: m.is_approved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: m.is_approved ? '#10b981' : '#f59e0b',
                                            textTransform: 'uppercase'
                                        }}>
                                            {m.is_approved ? 'Aprovado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleToggleShuraApproval(m.id, m.is_approved)}
                                            style={{
                                                padding: '6px 12px',
                                                background: m.is_approved ? '#f59e0b' : '#10b981',
                                                color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
                                            }}
                                        >
                                            {m.is_approved ? 'Rejeitar' : 'Aprovar'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteShuraMessage(m.id)}
                                            style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                        >
                                            Deletar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
