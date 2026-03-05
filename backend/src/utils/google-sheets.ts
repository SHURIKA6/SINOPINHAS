import type { Env } from '../types';

interface SheetsEnv extends Env {
    GOOGLE_SHEETS_URL?: string;
}

interface SheetEntry {
    sheet: string;
    data: Record<string, unknown>;
}

/**
 * Envia dados para uma aba específica do Google Sheets
 */
export async function sendToGoogleSheets(
    sheetName: string,
    data: Record<string, unknown>,
    env: SheetsEnv
): Promise<void> {
    const url = env.GOOGLE_SHEETS_URL;
    if (!url) return;
    if (!url.startsWith('https://')) {
        console.error('❌ GOOGLE_SHEETS_URL deve usar HTTPS');
        return;
    }

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
        console.error(`❌ Erro ao enviar para Google Sheets [${sheetName}]:`, (err as Error).message);
    }
}

/**
 * Envia múltiplas entradas de uma vez (batch)
 */
export async function batchSendToSheets(entries: SheetEntry[], env: SheetsEnv): Promise<void> {
    const url = env.GOOGLE_SHEETS_URL;
    if (!url || !entries.length) return;
    if (!url.startsWith('https://')) {
        console.error('❌ GOOGLE_SHEETS_URL deve usar HTTPS');
        return;
    }

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
        console.error('❌ Erro no batch para Google Sheets:', (err as Error).message);
    }
}
