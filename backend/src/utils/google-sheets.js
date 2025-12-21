export async function sendToGoogleSheets(logData, env) {
    const url = env.GOOGLE_SHEETS_URL;
    if (!url) return;

    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                ...logData
            }),
        });
    } catch (err) {
        console.error("❌ Erro ao enviar para Google Sheets:", err);
    }
}
