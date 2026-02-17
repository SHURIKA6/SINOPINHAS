import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function StoriesBar({ stories, currentUser, onStoryClick, onAddStory }) {
    const scrollRef = useRef(null);

    // Agrupar stories: Primeiro o usuário atual (para adicionar), depois os outros
    // stories é um array de { user_id, username, avatar, stories: [], all_viewed: bool }

    const hasMyStory = stories.find(s => s.user_id === currentUser?.id);
    const otherStories = stories.filter(s => s.user_id !== currentUser?.id);

    return (
        <div className="stories-container">
            <div className="stories-scroll" ref={scrollRef}>
                {/* Botão de Adicionar Story (Sempre o primeiro) */}
                <div className="story-item" onClick={onAddStory}>
                    <div className={`story-ring ${hasMyStory ? (hasMyStory.all_viewed ? 'viewed' : 'active') : 'add'}`}>
                        <div className="story-avatar">
                            {currentUser?.avatar ? (
                                <img src={currentUser.avatar} alt="Seu story" />
                            ) : (
                                <div className="avatar-placeholder">{currentUser?.username?.[0]}</div>
                            )}
                            {!hasMyStory && (
                                <div className="add-badge">
                                    <Plus size={14} color="white" strokeWidth={3} />
                                </div>
                            )}
                        </div>
                    </div>
                    <span className="story-username">Seu story</span>
                </div>

                {/* Lista de Stories de outros usuários */}
                {otherStories.map((group) => (
                    <div
                        key={group.user_id}
                        className="story-item"
                        onClick={() => onStoryClick(group)}
                    >
                        <div className={`story-ring ${group.all_viewed ? 'viewed' : 'active'}`}>
                            <div className="story-avatar">
                                {group.avatar ? (
                                    <img src={group.avatar} alt={group.username} />
                                ) : (
                                    <div className="avatar-placeholder">{group.username?.[0]}</div>
                                )}
                            </div>
                        </div>
                        <span className="story-username">{group.username}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .stories-container {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding: 12px 0;
                    margin-bottom: 2px;
                    overflow: hidden;
                }

                .stories-scroll {
                    display: flex;
                    gap: 16px;
                    padding: 0 16px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -webkit-overflow-scrolling: touch;
                }

                .stories-scroll::-webkit-scrollbar {
                    display: none;
                }

                .story-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    width: 72px; /* Largura fixa para alinhamento */
                    flex-shrink: 0;
                }

                .story-ring {
                    width: 68px;
                    height: 68px;
                    border-radius: 50%;
                    padding: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                
                .story-item:active .story-ring {
                    transform: scale(0.95);
                }

                /* Anel de gradiente para stories não vistos */
                .story-ring.active {
                    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
                }

                /* Anel cinza para stories vistos */
                .story-ring.viewed {
                    background: #ddd;
                }

                /* Sem anel (apenas placeholder para adicionar) */
                .story-ring.add {
                    background: transparent;
                    padding: 0;
                    width: 66px;
                    height: 66px;
                }

                .story-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 3px solid white;
                    background: #eee;
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .story-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    font-size: 24px;
                    font-weight: bold;
                    color: #aaa;
                    text-transform: uppercase;
                }

                .add-badge {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    background: #0095f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .story-username {
                    font-size: 11px;
                    color: #262626;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    max-width: 74px;
                }
                
                :global(.dark-mode) .stories-container {
                    background: rgba(0, 0, 0, 0.8);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                :global(.dark-mode) .story-username {
                    color: #fff;
                }
                
                :global(.dark-mode) .story-avatar {
                    border: 3px solid #000;
                    background: #333;
                }
                
                :global(.dark-mode) .story-ring.viewed {
                    background: #555;
                }
            `}</style>
        </div>
    );
}
