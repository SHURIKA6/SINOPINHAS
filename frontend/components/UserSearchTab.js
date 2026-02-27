import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, UserX } from 'lucide-react';
import { searchUsers } from '../services/api';

export default function UserSearchTab() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchResults = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const data = await searchUsers(searchQuery);
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchResults(query);
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [query, fetchResults]);

    return (
        <div className="search-tab-container">
            <div className="search-header">
                <div className="search-bar">
                    <Search size={20} color="#999" />
                    <input 
                        type="text" 
                        placeholder="Pesquisar usuários..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="search-results">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Buscando...</p>
                    </div>
                ) : query.trim().length > 0 && query.trim().length < 2 ? (
                    <div className="empty-state">
                        <p>Digite pelo menos 2 letras para buscar.</p>
                    </div>
                ) : results.length > 0 ? (
                    results.map(user => (
                        <div 
                            key={user.id} 
                            className="user-row"
                            onClick={() => router.push(`/profile/${user.id}`)}
                        >
                            <img 
                                src={user.avatar || "https://api.dicebear.com/6.x/avataaars/svg?seed=" + user.username} 
                                alt={user.username} 
                                className="user-avatar" 
                                onError={(e) => { e.target.src = "https://api.dicebear.com/6.x/avataaars/svg?seed=fallback"; }}
                            />
                            <div className="user-info">
                                <strong>{user.username}</strong>
                                <span>{user.role === 'admin' ? "Administrador" : "Usuário"} • {user.video_count || 0} Vídeos</span>
                            </div>
                        </div>
                    ))
                ) : query.trim().length >= 2 && !loading ? (
                    <div className="empty-state">
                        <UserX size={40} color="#ccc" />
                        <p>Nenhum usuário encontrado com "{query}"</p>
                    </div>
                ) : (
                    <div className="empty-state initial">
                        <p>Encontre seus amigos no Sinopinhas!</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .search-tab-container {
                    padding: 20px 16px 100px;
                    min-height: 100vh;
                    background: transparent;
                }

                .search-header {
                    position: sticky;
                    top: 10px;
                    z-index: 10;
                    margin-bottom: 24px;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 20px;
                    padding: 12px 16px;
                    box-shadow: 0 8px 24px rgba(0, 71, 171, 0.1);
                }

                .search-bar input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-size: 16px;
                    color: #1a1a2e;
                    outline: none;
                }

                .search-bar input::placeholder {
                    color: #999;
                }

                .search-results {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .user-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(8px);
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .user-row:hover {
                    background: rgba(255, 255, 255, 0.9);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }

                .user-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(0, 150, 255, 0.2);
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .user-info strong {
                    font-size: 15px;
                    color: #1a1a2e;
                }

                .user-info span {
                    font-size: 12px;
                    color: #666;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px 20px;
                    text-align: center;
                    color: #888;
                }

                .empty-state.initial {
                    color: rgba(26, 26, 46, 0.6);
                    font-size: 15px;
                    font-weight: 500;
                }

                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 40px;
                    color: #666;
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(0, 150, 255, 0.2);
                    border-top-color: #0096FF;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
