const deleteVideo = async (videoId) => {
  if (!user && !isAdmin) return showToast('Faça login para deletar vídeos', 'error');
  if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

  try {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`, {
      data: { userId: user?.id.toString() || 'admin_override' }
    });

    showToast('Vídeo deletado com sucesso!', 'success');
    await loadVideos();
  } catch (err) {
    showToast(err.response?.data?.error || 'Erro ao deletar vídeo', 'error');
  }
};

const canDelete = (ownerId) => isAdmin || (user && user.id.toString() === ownerId);
