import { useState, useCallback } from 'react';
import { fetchComments, postComment, deleteComment } from '../services/api';

export function useComments(showToast, user, isAdmin, adminPassword) {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadComments = useCallback(async (videoId) => {
        setIsLoading(true);
        setComments([]); // Limpa comentários anteriores para evitar "vazamento" de histórico
        try {
            const data = await fetchComments(videoId);
            setComments(data);
        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar comentários', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    const addComment = useCallback(async (videoId, text) => {
        if (!user) {
            showToast('Faça login para comentar', 'error');
            return false;
        }
        if (!text.trim()) return false;

        try {
            await postComment(videoId, user.id, text);
            await loadComments(videoId); // Reload
            showToast('Comentário enviado!', 'success');
            return true;
        } catch (err) {
            showToast(err.message || 'Erro ao comentar', 'error');
            return false;
        }
    }, [user, showToast, loadComments]);

    const removeComment = useCallback(async (commentId, videoId) => {
        if (!confirm('Deletar este comentário?')) return;
        try {
            await deleteComment(commentId, user.id, isAdmin ? adminPassword : null);
            await loadComments(videoId); // Reload
            showToast('Comentário deletado!', 'success');
        } catch (err) {
            showToast(err.message || 'Erro ao deletar comentário', 'error');
        }
    }, [user, isAdmin, adminPassword, showToast, loadComments]);

    return {
        comments,
        setComments,
        loadComments,
        addComment,
        removeComment,
        isLoading
    };
}
