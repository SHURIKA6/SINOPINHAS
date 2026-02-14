// PBKDF2 com salt aleatório por usuário — resistente a rainbow tables
// Formato armazenado: "pbkdf2:iterations:salt_hex:hash_hex"
// Compatível com senhas antigas em SHA-256 (migração transparente no login)

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Gera hash PBKDF2 com salt aleatório
 * @param {string} password - Senha em texto puro
 * @returns {string} - Hash no formato "pbkdf2:iterations:salt:hash"
 */
export async function hash(password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial, KEY_LENGTH * 8
    );

    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Compara senha com hash armazenado (suporta PBKDF2 e SHA-256 legado)
 * @param {string} password - Senha em texto puro
 * @param {string} storedHash - Hash armazenado no banco
 * @returns {{ valid: boolean, needsRehash: boolean }}
 */
export async function compare(password, storedHash) {
    // Formato novo: "pbkdf2:iterations:salt:hash"
    if (storedHash.startsWith('pbkdf2:')) {
        const [, iterStr, saltHex, expectedHash] = storedHash.split(':');
        const iterations = parseInt(iterStr);
        const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
        const encoder = new TextEncoder();

        const keyMaterial = await crypto.subtle.importKey(
            'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
            keyMaterial, KEY_LENGTH * 8
        );

        const computedHash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

        return { valid: computedHash === expectedHash, needsRehash: false };
    }

    // Formato legado: SHA-256 com salt estático
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "SINOPINHAS_SALT_2025");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const legacyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return { valid: legacyHash === storedHash, needsRehash: true };
}
