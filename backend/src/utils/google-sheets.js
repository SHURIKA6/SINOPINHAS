/**
 * Utilitário: Envio de dados para Google Sheets
 * Envia registros para abas específicas da planilha via Google Apps Script Web App
 */

/**
 * Envia dados para uma aba específica do Google Sheets
 * @param {string} sheetName - Nome da aba/tabela (ex: 'audit_logs', 'users', 'videos')
 * @param {object} data - Dados a serem inseridos
 * @param {object} env - Variáveis de ambiente do Cloudflare Worker
 */
export async function sendToGoogleSheets(sheetName, data, env) {
    const url = env.GOOGLE_SHEETS_URL;
    if (!url) return;

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sheet: sheetName,
                data: {
                    timestamp: new Date().toISOString(),
                    ...data
                }
            }),
        });
    } catch (err) {
        console.error(`❌ Erro ao enviar para Google Sheets [${sheetName}]:`, err.message);
    }
}

/**
 * Envia múltiplas entradas de uma vez (batch)
 * @param {Array<{sheet: string, data: object}>} entries - Array de entradas
 * @param {object} env - Variáveis de ambiente
 */
export async function batchSendToSheets(entries, env) {
    const url = env.GOOGLE_SHEETS_URL;
    if (!url || !entries.length) return;

    try {
        const payload = entries.map(e => ({
            sheet: e.sheet,
            data: {
                timestamp: new Date().toISOString(),
                ...e.data
            }
        }));

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error('❌ Erro no batch para Google Sheets:', err.message);
    }
}
