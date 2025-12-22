export function getAchievementList(u) {
    const list = [];
    // 1. Sinopense (Sempre - Base)
    list.push({ type: 'sinopense', icon: '🏙️', label: 'Sinopense', color: '#10b981', desc: 'Membro oficial da nossa comunidade' });

    // 2. Pioneiro (As 50 contas ativas mais antigas)
    // global_rank is calculated based on ID order
    if (u.global_rank <= 50) {
        list.push({ type: 'pioneiro', icon: '⭐', label: 'Pioneiro', color: '#fbbf24', desc: 'Uma das 50 contas mais antigas ainda ativas' });
    }

    // 3. Criador / Diretor (Baseado em posts)
    if (u.video_count > 5) {
        list.push({ type: 'diretor', icon: '🎥', label: 'Diretor', color: '#f97316', desc: 'Mestre do conteúdo com mais de 5 postagens' });
    } else if (u.video_count > 0) {
        list.push({ type: 'criador', icon: '🎬', label: 'Criador', color: '#8d6aff', desc: 'Já contribuiu com conteúdos para o mural' });
    }

    // 4. Popular (Likes recebidos)
    if ((u.total_likes_received || u.total_likes) >= 50) {
        list.push({ type: 'popular', icon: '🔥', label: 'Popular', color: '#ff4444', desc: 'Seus conteúdos brilham! Mais de 50 curtidas recebidas' });
    }

    // 5. Tagarela (Comentários feitos)
    if (u.comment_count_made >= 10) {
        list.push({ type: 'tagarela', icon: '💬', label: 'Tagarela', color: '#3b82f6', desc: 'Sempre engajado! Mais de 10 comentários feitos' });
    }

    // 6. Amigável (Likes dados)
    if (u.likes_given >= 20) {
        list.push({ type: 'amigavel', icon: '❤️', label: 'Amigável', color: '#ec4899', desc: 'Espalhando amor! Deu mais de 20 curtidas' });
    }

    // 7. Admin (Cargo Especial)
    if (u.role === 'admin') {
        list.push({ type: 'admin', icon: '🛡️', label: 'Admin', color: '#6366f1', desc: 'Guardião e moderador oficial do Sinopinhas' });
    }

    return list;
}
