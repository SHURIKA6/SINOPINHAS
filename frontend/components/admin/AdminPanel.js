import { useState, useEffect } from 'react';
import { fetchUsers, fetchLogs, resetUserPassword, banUser } from '../../services/api';

export default function AdminPanel({ adminPassword, showToast }) {
    const [usersList, setUsersList] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        loadUsers();
        loadLogs();
    }, [adminPassword]);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsersList(data);
        } catch (err) {
            if (err.status === 401) {
                showToast('Sessão expirada. Faça login novamente.', 'error');
            } else {
                showToast('Erro ao carregar usuários', 'error');
            }
        }
    };

    const loadLogs = async () => {
        try {
            const data = await fetchLogs();
            setLogs(data);
        } catch (err) {
            if (err.status === 401) return; // Already handled by loadUsers toast potentially
            showToast('Erro ao buscar registros', 'error');
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

    return (
        <div>
            <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>🛡️ Painel Admin</h2>

            <div style={{ marginBottom: 40 }}>
                <h3 style={{ fontSize: 20, marginBottom: 16 }}>👥 Usuários Cadastrados ({usersList.length})</h3>
                <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#303030' }}>
                                <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Usuário</th>
                                <th style={{ padding: 12, textAlign: 'left' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #303030' }}>
                                    <td style={{ padding: 12 }}>#{u.id}</td>
                                    <td style={{ padding: 12 }}>{u.username}</td>
                                    <td style={{ padding: 12, display: 'flex', gap: 8 }}>
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

            <div>
                <h3 style={{ fontSize: 20, marginBottom: 16 }}>📊 Logs de Auditoria (últimos 100)</h3>
                <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'auto', maxHeight: 600 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#303030', zIndex: 1 }}>
                            <tr>
                                <th style={{ padding: 10, textAlign: 'left', whiteSpace: 'nowrap' }}>Data/Hora</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Usuário</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>IP Real</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Localização</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Dispositivo</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Sistema</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Navegador</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Resolução</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Fingerprint</th>
                                <th style={{ padding: 10, textAlign: 'left' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #303030' }}>
                                    <td style={{ padding: 10, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                                    <td style={{ padding: 10 }}>{log.username || 'Anônimo'}</td>
                                    <td style={{ padding: 10, fontFamily: 'monospace' }}>{log.ip}</td>
                                    <td style={{ padding: 10 }}>
                                        {log.city ? `${log.city}, ${log.country}` : log.country || 'N/A'}
                                        {log.latitude && log.longitude && (
                                            <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                                                📍 {parseFloat(log.latitude).toFixed(4)}, {parseFloat(log.longitude).toFixed(4)}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: 10 }}>{log.device_type}</td>
                                    <td style={{ padding: 10 }}>{log.os || 'N/A'}</td>
                                    <td style={{ padding: 10 }}>{log.browser || 'N/A'}</td>
                                    <td style={{ padding: 10 }}>{log.screen_resolution || 'N/A'}</td>
                                    <td style={{ padding: 10, fontFamily: 'monospace', fontSize: 11 }}>
                                        {log.fingerprint ? log.fingerprint.substring(0, 12) + '...' : 'N/A'}
                                    </td>
                                    <td style={{ padding: 10, fontWeight: 600, color: '#8d6aff' }}>{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
