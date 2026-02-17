// ===================================
// Constantes Centralizadas do Backend
// ===================================

// --- Tipos MIME Permitidos para Upload ---
export const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'
];

// --- Limites de Tamanho de Arquivo ---
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

// --- TTLs de Cache (segundos) ---
export const CACHE_TTL = {
    VIDEOS_PUBLIC: 300,    // 5 minutos — lista pública de vídeos
    VIDEOS_SECRET: 60,     // 1 minuto — lista restrita
    NEWS: 900,             // 15 minutos — notícias externas
    WEATHER: 600,          // 10 minutos — dados climáticos
};

// --- Magic Bytes (assinaturas de arquivos) para validação de conteúdo ---
// Cada entrada: { mime, signatures: [{ offset, bytes }] }
export const MAGIC_BYTES = [
    // Vídeos
    { mime: 'video/mp4', signatures: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }] },            // ftyp
    { mime: 'video/webm', signatures: [{ offset: 0, bytes: [0x1A, 0x45, 0xDF, 0xA3] }] },            // EBML
    { mime: 'video/quicktime', signatures: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74] }] }, // ftypqt
    { mime: 'video/x-msvideo', signatures: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }] },            // RIFF
    // Imagens
    { mime: 'image/jpeg', signatures: [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }] },
    { mime: 'image/png', signatures: [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] }] },
    { mime: 'image/gif', signatures: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },            // GIF8
    {
        mime: 'image/webp', signatures: [
            { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },  // RIFF
            { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }    // WEBP
        ]
    },
    { mime: 'image/avif', signatures: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }] },            // ftyp (similar ao mp4)
];

// --- Ações Críticas para Alertas (Audit) ---
export const CRITICAL_AUDIT_ACTIONS = [
    'VIDEO_DELETED', 'VIDEO_DELETED_R2',
    'ADMIN_LOGIN_SUCCESS', 'ADMIN_USER_BANNED',
    'ADMIN_PASSWORD_RESET'
];

// --- Paginação ---
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
