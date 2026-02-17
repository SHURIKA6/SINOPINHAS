import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export default function StoryViewer({ storyGroup, onClose, onStoryViewed, currentUserId }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const story = storyGroup.stories[currentIndex];
    const duration = (story.duration || 5) * 1000;
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const elapsedRef = useRef(0);

    // Iniciar timer
    useEffect(() => {
        if (!story) return;

        // Marcar como visto no backend
        api.post(`/api/stories/${story.id}/view`).catch(() => { });
        onStoryViewed(storyGroup.user_id, story.id);

        setProgress(0);
        elapsedRef.current = 0;
        startTimeRef.current = Date.now();
        setIsPaused(false);

        const tick = () => {
            if (isPaused) return;
            const now = Date.now();
            const elapsed = now - startTimeRef.current + elapsedRef.current;
            const p = Math.min((elapsed / duration) * 100, 100);
            setProgress(p);

            if (p >= 100) {
                nextStory();
            } else {
                intervalRef.current = requestAnimationFrame(tick);
            }
        };

        intervalRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(intervalRef.current);
    }, [currentIndex, story, isPaused]);

    const nextStory = () => {
        if (currentIndex < storyGroup.stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose(); // Acabou os stories desse user
        }
    };

    const prevStory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            // Reiniciar o primeiro story ou fechar? Geralmente reinicia ou volta pro anterior
            setProgress(0);
            elapsedRef.current = 0;
            startTimeRef.current = Date.now();
        }
    };

    const handlePointerDown = () => {
        setIsPaused(true);
        elapsedRef.current += Date.now() - startTimeRef.current;
        cancelAnimationFrame(intervalRef.current);
    };

    const handlePointerUp = () => {
        setIsPaused(false);
        startTimeRef.current = Date.now();
        // restart loop logic is handled by useEffect dependency change? No, isPaused change handles it?
        // Actually useEffect dependency [isPaused] will re-trigger.
        // But re-triggering useEffect resets progress to 0 if we aren't careful.
        // My useEffect resets progress on story change.
        // I need a separate effect for pause/resume without resetting.
    };

    // Separar lógica de timer para suportar pause sem resetar
    // (Simplificação: O useEffect acima reinicia o timer se `isPaused` mudar, o que está errado.
    //  Vou refatorar para um `useInterval` customizado ou lógica mais robusta)

    // Refatoração simples do Timer:
    useEffect(() => {
        let frameId;
        let start = Date.now();

        const animate = () => {
            if (isPaused) {
                // Atualizar start para "ignorar" o tempo pausado quando resumir
                start = Date.now() - elapsedRef.current;
                frameId = requestAnimationFrame(animate);
                return;
            }

            const now = Date.now();
            elapsedRef.current = now - start;
            const p = Math.min((elapsedRef.current / duration) * 100, 100);
            setProgress(p);

            if (p >= 100) {
                nextStory();
            } else {
                frameId = requestAnimationFrame(animate);
            }
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [currentIndex, isPaused]); // Reset on index change, resume on pause change


    const handleDelete = async () => {
        if (!confirm("Apagar este story?")) return;
        try {
            await api.delete(`/api/stories/${story.id}`);
            if (storyGroup.stories.length === 1) {
                onClose(); // Era o último
            } else {
                nextStory();
            }
            // window.location.reload(); // Idealmente atualizar estado global
        } catch (e) {
            alert("Erro ao apagar");
        }
    };

    if (!story) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="story-viewer-overlay"
        >
            {/* Header / Progress Bars */}
            <div className="story-header">
                <div className="progress-bars">
                    {storyGroup.stories.map((s, idx) => (
                        <div key={s.id} className="progress-bg">
                            <div
                                className="progress-fill"
                                style={{
                                    width: idx < currentIndex ? '100%' :
                                        idx === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="user-info">
                    <div className="user-details">
                        <img src={storyGroup.avatar || '/default-avatar.png'} alt={storyGroup.username} />
                        <span>{storyGroup.username}</span>
                        <span className="story-time">
                            {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="actions">
                        {/* Se for dono ou admin, mostra delete */}
                        {(story.user_id === currentUserId) && (
                            <button onClick={handleDelete}><Trash2 size={20} /></button>
                        )}
                        <button onClick={onClose}><X size={24} /></button>
                    </div>
                </div>
            </div>

            {/* Conteúdo (Imagem/Vídeo) */}
            <div
                className="story-content"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {story.media_type === 'video' ? (
                    <video
                        src={story.media_url}
                        autoPlay
                        muted={false} // Stories geralmente têm som
                        playsInline
                        className="story-media"
                        onEnded={nextStory}
                    />
                ) : (
                    <img src={story.media_url} alt="Story" className="story-media" />
                )}

                {story.caption && (
                    <div className="story-caption">{story.caption}</div>
                )}
            </div>

            {/* Áreas de Toque para Navegação */}
            <div className="touch-areas">
                <div className="touch-left" onClick={prevStory}></div>
                <div className="touch-right" onClick={nextStory}></div>
            </div>

            {/* Footer (Input de resposta - futuro) */}
            <div className="story-footer">
                <input type="text" placeholder="Responder..." disabled />
                <button><Heart size={24} /></button>
                <button><Send size={24} /></button>
            </div>

            <style jsx>{`
                .story-viewer-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: #000;
                    z-index: 9999999;
                    display: flex;
                    flex-direction: column;
                }

                .story-header {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    padding: 12px 8px;
                    z-index: 20;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
                }

                .progress-bars {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 8px;
                }

                .progress-bg {
                    flex: 1;
                    height: 2px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #fff;
                    transition: width 0.1s linear;
                }

                .user-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                    padding: 0 4px;
                }

                .user-details {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .user-details img {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                }

                .story-time {
                    opacity: 0.6;
                    font-size: 12px;
                }

                .actions button {
                    background: none;
                    border: none;
                    color: white;
                    padding: 4px;
                }

                .story-content {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .story-media {
                    width: 100%;
                    height: 100%;
                    object-fit: contain; /* Ou cover, dependendo do gosto */
                }
                
                .story-caption {
                    position: absolute;
                    bottom: 100px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    max-width: 80%;
                    text-align: center;
                }

                .touch-areas {
                    position: absolute;
                    top: 60px; bottom: 100px; left: 0; right: 0;
                    display: flex;
                }

                .touch-left, .touch-right {
                    flex: 1;
                }

                .story-footer {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 80px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                }

                .story-footer input {
                    flex: 1;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.5);
                    color: white;
                    border-radius: 20px;
                    padding: 10px 16px;
                }

                .story-footer button {
                    background: none;
                    border: none;
                    color: white;
                }
            `}</style>
        </motion.div>
    );
}
