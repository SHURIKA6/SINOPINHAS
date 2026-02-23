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
                {/* Botão de Adicionar Story (Apenas se logado) */}
                {currentUser && (
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
                )}

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
                    background: linear-gradient(180deg,
                        rgba(255, 255, 255, 0.7) 0%,
                        rgba(255, 255, 255, 0.4) 40%,
                        rgba(255, 255, 255, 0.25) 100%);
                    backdrop-filter: blur(16px) saturate(120%);
                    -webkit-backdrop-filter: blur(16px) saturate(120%);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-top: 1px solid rgba(255, 255, 255, 0.9);
                    border-radius: 16px;
                    margin: 4px 8px 8px;
                    padding: 14px 0;
                    overflow: hidden;
                    position: relative;
                    box-shadow:
                        0 4px 20px rgba(0, 71, 171, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }

                /* Brilho vítreo Aero na metade superior */
                .stories-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(to bottom,
                        rgba(255, 255, 255, 0.6) 0%,
                        rgba(255, 255, 255, 0.1) 100%);
                    pointer-events: none;
                    border-radius: 14px 14px 60% 60% / 10px 10px 20px 20px;
                }

                .stories-scroll {
                    display: flex;
                    gap: 14px;
                    padding: 0 16px;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -webkit-overflow-scrolling: touch;
                    position: relative;
                    z-index: 1;
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
                    width: 74px;
                    flex-shrink: 0;
                    transition: transform 0.2s ease;
                }

                .story-item:hover {
                    transform: translateY(-2px);
                }

                .story-ring {
                    width: 68px;
                    height: 68px;
                    border-radius: 50%;
                    padding: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.25s ease;
                    position: relative;
                }
                
                .story-item:active .story-ring {
                    transform: scale(0.93);
                }

                /* Anel de gradiente azul Aero para stories não vistos */
                .story-ring.active {
                    background: linear-gradient(135deg, #00C6FF 0%, #0047AB 50%, #4DA6FF 100%);
                    box-shadow: 0 2px 12px rgba(0, 71, 171, 0.4);
                }

                .story-ring.active:hover {
                    box-shadow: 0 4px 18px rgba(0, 198, 255, 0.5);
                }

                /* Anel cinza suave para stories vistos */
                .story-ring.viewed {
                    background: linear-gradient(180deg, rgba(200, 215, 230, 0.8) 0%, rgba(180, 195, 210, 0.6) 100%);
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
                }

                /* Sem anel (apenas placeholder para adicionar) */
                .story-ring.add {
                    background: linear-gradient(180deg,
                        rgba(255, 255, 255, 0.8) 0%,
                        rgba(230, 240, 255, 0.5) 100%);
                    border: 2px dashed rgba(0, 71, 171, 0.3);
                    padding: 2px;
                    width: 68px;
                    height: 68px;
                    box-shadow: 0 2px 8px rgba(0, 71, 171, 0.08);
                }

                .story-ring.add:hover {
                    border-color: rgba(0, 198, 255, 0.6);
                    background: linear-gradient(180deg,
                        rgba(255, 255, 255, 0.95) 0%,
                        rgba(220, 240, 255, 0.7) 100%);
                    box-shadow: 0 4px 12px rgba(0, 198, 255, 0.2);
                }

                .story-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2.5px solid rgba(255, 255, 255, 0.95);
                    background: linear-gradient(180deg, #f0f4f8 0%, #dde6ef 100%);
                    overflow: hidden;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
                }

                .story-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-placeholder {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0047AB;
                    text-transform: uppercase;
                    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
                }

                .add-badge {
                    position: absolute;
                    bottom: 1px;
                    right: 1px;
                    background: linear-gradient(180deg, #4DA6FF 0%, #0047AB 100%);
                    border: 2px solid rgba(255, 255, 255, 0.95);
                    border-radius: 50%;
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 6px rgba(0, 71, 171, 0.4);
                    transition: all 0.2s ease;
                }

                .story-item:hover .add-badge {
                    transform: scale(1.1);
                    box-shadow: 0 3px 10px rgba(0, 198, 255, 0.5);
                }

                .story-username {
                    font-size: 11px;
                    font-weight: 600;
                    color: #003366;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    max-width: 74px;
                    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
                }
                
                :global(.dark-mode) .stories-container {
                    background: linear-gradient(180deg,
                        rgba(10, 30, 60, 0.75) 0%,
                        rgba(5, 20, 40, 0.6) 100%);
                    border: 1px solid rgba(100, 160, 255, 0.2);
                    border-top: 1px solid rgba(100, 160, 255, 0.3);
                    box-shadow:
                        0 4px 20px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(100, 160, 255, 0.15);
                }

                :global(.dark-mode) .stories-container::before {
                    background: linear-gradient(to bottom,
                        rgba(100, 160, 255, 0.1) 0%,
                        transparent 100%);
                }

                :global(.dark-mode) .story-username {
                    color: #c8d8ff;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                }
                
                :global(.dark-mode) .story-avatar {
                    border: 2.5px solid rgba(20, 40, 70, 0.9);
                    background: linear-gradient(180deg, #1a2a40 0%, #0d1a2d 100%);
                }

                :global(.dark-mode) .avatar-placeholder {
                    color: #4DA6FF;
                }
                
                :global(.dark-mode) .story-ring.viewed {
                    background: linear-gradient(180deg, rgba(60, 80, 110, 0.6) 0%, rgba(40, 60, 85, 0.4) 100%);
                }

                :global(.dark-mode) .story-ring.add {
                    background: linear-gradient(180deg, rgba(20, 40, 70, 0.6) 0%, rgba(10, 25, 50, 0.4) 100%);
                    border-color: rgba(77, 166, 255, 0.3);
                }

                :global(.dark-mode) .add-badge {
                    border-color: rgba(20, 40, 70, 0.9);
                }
            `}</style>
        </div>
    );
}
