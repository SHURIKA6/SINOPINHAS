import { useState, useCallback, useEffect } from 'react';
import { fetchVideos, fetchSecretVideos, removeVideo } from '../services/api';

export function useFeed(activeTab, user, isAdmin, adminPassword, showToast) {
    const [videos, setVideos] = useState([]);
    const [secretVideos, setSecretVideos] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadVideos = useCallback(async () => {
        if (activeTab !== 'videos' && activeTab !== 'secret') return;

        setLoading(true);
        try {
            if (activeTab === 'videos') {
                const data = await fetchVideos(user?.id);
                setVideos(data);
            } else if (activeTab === 'secret') {
                const data = await fetchSecretVideos(user?.id);
                setSecretVideos(data);
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao carregar vídeos', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab, user, showToast]);

    const deleteVideo = useCallback(async (videoId) => {
        if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;
        try {
            await removeVideo(videoId, user.id, isAdmin ? adminPassword : null);
            showToast('Vídeo deletado com sucesso', 'success');
            loadVideos(); // Reload current feed
        } catch (err) {
            console.error(err);
            showToast('Erro ao deletar vídeo', 'error');
        }
    }, [user, isAdmin, adminPassword, showToast, loadVideos]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    return {
        videos,
        secretVideos,
        loading,
        refreshFeed: loadVideos,
        deleteVideo
    };
}
