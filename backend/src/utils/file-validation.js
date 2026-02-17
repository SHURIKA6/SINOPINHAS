import { MAGIC_BYTES, ALLOWED_MIME_TYPES } from './constants.js';

/**
 * Valida o conteúdo real do arquivo comparando os magic bytes (assinatura binária)
 * com o MIME type declarado pelo cliente.
 *
 * @param {ArrayBuffer} buffer - Primeiros bytes do arquivo (mínimo 16 bytes)
 * @param {string} declaredMime - MIME type declarado (ex: 'image/png')
 * @returns {{ valid: boolean, detectedType: string|null, reason?: string }}
 */
export function validateMagicBytes(buffer, declaredMime) {
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 12) {
        return { valid: false, detectedType: null, reason: 'Arquivo muito pequeno para validação' };
    }

    // Verificar se o MIME declarado é permitido
    if (!ALLOWED_MIME_TYPES.includes(declaredMime)) {
        return { valid: false, detectedType: null, reason: `Tipo MIME não permitido: ${declaredMime}` };
    }

    // Procurar match nos magic bytes conhecidos
    for (const entry of MAGIC_BYTES) {
        const allSigsMatch = entry.signatures.every(sig => {
            if (sig.offset + sig.bytes.length > bytes.length) return false;
            return sig.bytes.every((b, i) => bytes[sig.offset + i] === b);
        });

        if (allSigsMatch) {
            // Verificar se o tipo detectado é compatível com o declarado
            const isCompatible = isMimeCompatible(entry.mime, declaredMime);
            if (isCompatible) {
                return { valid: true, detectedType: entry.mime };
            }
        }
    }

    return {
        valid: false,
        detectedType: null,
        reason: `Conteúdo do arquivo não corresponde ao tipo declarado (${declaredMime})`
    };
}

/**
 * Verifica se dois MIME types são compatíveis.
 * Alguns formatos compartilham assinaturas (ex: MP4/AVIF/QuickTime usam 'ftyp', AVI/WebP usam 'RIFF').
 */
function isMimeCompatible(detected, declared) {
    // Match exato
    if (detected === declared) return true;

    // Grupos compatíveis (assinaturas compartilhadas)
    const compatGroups = [
        ['video/mp4', 'video/quicktime', 'image/avif'],   // ftyp-based
        ['video/x-msvideo', 'image/webp'],                 // RIFF-based
        ['image/jpeg', 'image/jpg'],                       // JPEG variants
    ];

    for (const group of compatGroups) {
        if (group.includes(detected) && group.includes(declared)) {
            return true;
        }
    }

    return false;
}
