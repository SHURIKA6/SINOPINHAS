import { useState, useEffect } from 'react';
import { fetchUsers, fetchLogs, fetchUserLogs, resetUserPassword, banUser, toggleUserRole, fetchAllShuraMessages, toggleApproveShuraMessage, deleteShuraMessage } from '../../services/api';

export default function AdminPanel({ adminPassword, showToast }) {
    const [usersList, setUsersList] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [shuraMessages, setShuraMessages] = useState([]);
    const [loadingShura, setLoadingShura] = useState(false);

    // New State for User Logs Modal
    const [selectedUserLog, setSelectedUserLog] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [loadingUserLogs, setLoadingUserLogs] = useState(false);

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

    const handleUserClick = async (user) => {
        setSelectedUserLog(user);
        setLoadingUserLogs(true);
        try {
            const logs = await fetchUserLogs(user.id);
            setUserLogs(logs);
        } catch (err) {
            showToast('Erro ao buscar logs do usuário', 'error');
            setUserLogs([]);
        } finally {
            setLoadingUserLogs(false);
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
        <div style={{ color: '#002244' }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 24, textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>🛡️ Painel Admin</h2>

            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, margin: 0 }}>👥 Usuários Cadastrados ({usersList.length})</h3>
                    <button
                        onClick={loadUsers}
                        disabled={loadingUsers}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            color: '#003366',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
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
                <div style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.2) 100%)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 71, 171, 0.15)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.8)' }}>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>ID</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Cargo</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(0, 71, 171, 0.1)', transition: 'all 0.2s', background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: 12, color: '#64748b' }}>#{u.id}</td>
                                    <td style={{ padding: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img src={u.avatar || 'https://via.placeholder.com/40'} alt={u.username} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                            <span
                                                onClick={() => handleUserClick(u)}
                                                style={{
                                                    fontWeight: 700,
                                                    color: '#8b5cf6', // Roxo solicitado
                                                    fontSize: 15,
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    textUnderlineOffset: 3
                                                }}
                                                title="Ver Dossiê de Logs"
                                            >
                                                {u.username}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                                            background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(203, 213, 225, 0.4)',
                                            color: u.role === 'admin' ? '#4f46e5' : '#475569'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleUserClick(u)} style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            📄 Logs
                                        </button>
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

            {/* System Logs Section */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 20, margin: 0 }}>📜 Logs do Sistema ({logs.length})</h3>
                    <button
                        onClick={loadLogs}
                        disabled={loadingLogs}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.5)',
                            color: '#003366',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    >
                        {loadingLogs ? '⏳' : '🔃'} Atualizar Logs
                    </button>
                </div>
                <div style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.2) 100%)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 71, 171, 0.15)',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.8)' }}>
                                <th style={{ padding: 12, textAlign: 'left', color: '#0047AB', fontWeight: 800 }}>Ação</th>
                                <th style={{ padding: 12, textAlign: 'left', color: '#0047AB', fontWeight: 800 }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'right', color: '#0047AB', fontWeight: 800 }}>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.6)' }}>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            background: 'rgba(0, 71, 171, 0.1)', color: '#0047AB',
                                            padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11
                                        }}>{log.action}</span>
                                        {log.details && (
                                            <div style={{ fontSize: 11, color: '#445566', marginTop: 4 }}>
                                                {log.city && <span style={{ marginRight: 8 }}>📍 {log.city}, {log.country}</span>}
                                                {log.ip && <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: 3 }}>{log.ip}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: 12, fontWeight: 600, color: '#002244' }}>
                                        {log.username ? log.username : (log.user_id ? `User #${log.user_id}` : 'Sistema')}
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'right', color: '#445566' }}>
                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: 40, textAlign: 'center', color: '#667788' }}>
                                        Nenhum log registrado ainda.
                                    </td>
                                </tr>
                            )}
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
                            background: 'rgba(255, 255, 255, 0.5)',
                            color: '#003366',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    >
                        {loadingShura ? '⏳' : '🔃'} Atualizar
                    </button>
                </div>
                <div style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 40%, rgba(255, 255, 255, 0.2) 100%)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0, 71, 171, 0.15)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.8)' }}>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Mensagem</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Status</th>
                                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.6)', color: '#0047AB', fontWeight: 800 }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shuraMessages.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>Nenhuma mensagem enviada ainda.</td></tr>
                            ) : shuraMessages.map((m) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.6)' }}>
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

            {/* Modal de Logs do Usuário */}
            {
                selectedUserLog && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(255, 255, 255, 0.1)', zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                        backdropFilter: 'blur(8px)'
                    }} onClick={() => setSelectedUserLog(null)}>
                        <div style={{
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
                            borderRadius: 24, maxWidth: 900, width: '100%', // Aumentei a largura
                            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 25px 50px -12px rgba(0, 71, 171, 0.25), inset 0 1px 0 rgba(255,255,255,0.8)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: '#002244', fontSize: 22, fontWeight: 900, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                                    📜 Dossiê: <span style={{ color: '#0047AB' }}>{selectedUserLog.username}</span>
                                </h3>
                                <button onClick={() => setSelectedUserLog(null)} style={{ background: 'none', border: 'none', color: '#0047AB', cursor: 'pointer', fontSize: 24, padding: 8, fontWeight: 'bold' }}>✕</button>
                            </div>

                            <div style={{ padding: 24, overflowY: 'auto' }}>
                                {loadingUserLogs ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#0047AB', fontWeight: 600 }}>Carregando logs...</div>
                                ) : userLogs.length === 0 ? (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#445566', fontStyle: 'italic' }}>
                                        Nenhum log encontrado para este usuário.
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ color: '#003366', borderBottom: '1px solid rgba(0, 71, 171, 0.1)' }}>
                                                <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 800 }}>Ação</th>
                                                <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 800 }}>Data</th>
                                                <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 800 }}>Localização (Cloudflare)</th>
                                                <th style={{ padding: '12px 0', textAlign: 'center', fontWeight: 800 }}>IP Network</th>
                                                <th style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800 }}>Dispositivo/Sistema</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userLogs.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid rgba(0, 71, 171, 0.05)', color: '#1e293b' }}>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{
                                                            background: 'rgba(0, 71, 171, 0.1)', color: '#0047AB',
                                                            padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11
                                                        }}>{log.action}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 0', color: '#334155' }}>
                                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                                    </td>
                                                    <td style={{ padding: '12px 0', color: '#334155' }}>
                                                        {log.city && log.country ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span>📍 {log.city}, {log.country}</span>
                                                                <span style={{ fontSize: 10, opacity: 0.7 }}>({log.asOrganization})</span>
                                                            </div>
                                                        ) : <span style={{ opacity: 0.5 }}>-</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 0', textAlign: 'center', fontFamily: 'monospace', color: '#334155' }}>
                                                        <div style={{ fontWeight: 'bold' }}>{log.ip || '---'}</div>
                                                        {log.details?.ray_id && <div style={{ fontSize: 10, opacity: 0.6 }}>Ray: {log.details.ray_id.substring(0, 8)}...</div>}
                                                    </td>
                                                    <td style={{ padding: '12px 0', textAlign: 'right', maxWidth: 200 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 'bold' }}>
                                                            {log.details?.platform ? log.details.platform.replace(/"/g, '') : 'Unknown'}
                                                            {log.details?.is_mobile === '?1' ? ' 📱' : ' 💻'}
                                                        </div>
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, opacity: 0.7 }} title={log.details?.user_agent}>
                                                            {log.details?.user_agent?.substring(0, 30)}...
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
