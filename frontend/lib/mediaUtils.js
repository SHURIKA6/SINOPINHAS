/**
 * Helpers para mídia (fotos/vídeos)
 * Centraliza lógica reutilizada em vários componentes
 */

/**
 * Verifica se a URL aponta para uma imagem (foto)
 * @param {string} url - URL do conteúdo
 * @returns {boolean}
 */
export function isPhotoUrl(url) {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp|avif|svg)(\?.*)?$/i.test(url);
}

/**
 * Formata data para exibição amigável em PT-BR
 * @param {string|Date} date - Data a formatar
 * @returns {string}
 */
export function formatDate(date) {
    if (!date) return '';
    try {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
}
