export function getAchievementList(u) {
    const list = [];

    // 1. Sinopense (Sempre - Base)
    list.push({
        type: 'sinopense',
        icon: '🏙️',
        label: 'Sinopense',
        color: '#10b981',
        desc: 'Membro oficial da nossa comunidade'
    });

    // 2. Pioneiro (As 50 contas ativas mais antigas)
    if (u.global_rank <= 50) {
        list.push({
            type: 'pioneiro',
            icon: '⭐',
            label: 'Pioneiro',
            color: '#fbbf24',
            desc: 'Uma das 50 contas mais antigas ainda ativas'
        });
    }

    // 3. Criador / Diretor (Baseado em posts)
    const videoCount = Number(u.video_count) || 0;
    if (videoCount > 10) {
        list.push({
            type: 'diretor',
            icon: '🎥',
            label: 'Diretor',
            color: '#f97316',
            desc: 'Mestre do conteúdo com mais de 10 postagens'
        });
    } else if (videoCount > 0) {
        list.push({
            type: 'criador',
            icon: '🎬',
            label: 'Criador',
            color: '#8d6aff',
            desc: 'Já contribuiu com conteúdos para o mural'
        });
    }

    // 4. Popular / Influenciador (Likes recebidos)
    const totalLikes = Number(u.total_likes_received) || 0;
    if (totalLikes >= 100) {
        list.push({
            type: 'influenciador',
            icon: '💎',
            label: 'Influenciador',
            color: '#a855f7',
            desc: 'Uma estrela em ascensão! Mais de 100 curtidas recebidas'
        });
    } else if (totalLikes >= 30) {
        list.push({
            type: 'popular',
            icon: '🔥',
            label: 'Popular',
            color: '#ff4444',
            desc: 'Seus conteúdos brilham! Mais de 30 curtidas recebidas'
        });
    }

    // 5. Tagarela (Comentários feitos)
    const commentCount = Number(u.comment_count_made) || 0;
    if (commentCount >= 10) {
        list.push({
            type: 'tagarela',
            icon: '💬',
            label: 'Tagarela',
            color: '#3b82f6',
            desc: 'Sempre engajado! Mais de 10 comentários feitos'
        });
    }

    // 6. Amigável (Likes dados)
    const likesGiven = Number(u.likes_given) || 0;
    if (likesGiven >= 20) {
        list.push({
            type: 'amigavel',
            icon: '❤️',
            label: 'Amigável',
            color: '#ec4899',
            desc: 'Espalhando amor! Deu mais de 20 curtidas'
        });
    }

    // 7. Admin / Mod (Cargo Especial)
    if (u.role === 'admin') {
        list.push({
            type: 'admin',
            icon: '🛡️',
            label: 'Admin',
            color: '#6366f1',
            desc: 'Guardião e moderador oficial do Sinopinhas'
        });
    }

    // 8. Hacker (Segredo)
    // 8. Hacker (Segredo)
    if (u.discovered_logs === true || u.discovered_logs === 'true' || u.discovered_logs === 't') {
        list.push({
            type: 'hacker',
            icon: '⌨️',
            label: 'Explorador',
            color: '#00ff41',
            desc: 'Descobriu os segredos ocultos nos logs do sistema'
        });
    }

    return list;
}

