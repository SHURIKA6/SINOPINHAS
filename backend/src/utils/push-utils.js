import { queryDB } from '../db/index.js';

/**
 * Utilitário para enviar notificações Push via WebPush (VAPID)
 * Implementado usando Web Crypto API (compatível com Cloudflare Workers)
 */

// Helper para converter base64 para ArrayBuffer
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function sendWebPush(subscription, payload, env) {
    const publicKey = env.VAPID_PUBLIC_KEY;
    const privateKey = env.VAPID_PRIVATE_KEY;
    const subject = env.VAPID_SUBJECT || 'mailto:admin@sinopinhas.com';

    if (!publicKey || !privateKey) {
        console.warn("⚠️ VAPID keys missing. Push notification skipped.");
        return;
    }

    try {
        const endpoint = new URL(subscription.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;

        // 1. Criar o JWT para o cabeçalho Authorization
        const header = { alg: 'ES256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const claims = {
            aud: audience,
            exp: now + (12 * 60 * 60), // 12 horas
            sub: subject
        };

        const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const tokenData = `${encodedHeader}.${encodedClaims}`;

        // Importar a chave privada para assinatura
        const privateKeyBuffer = urlBase64ToUint8Array(privateKey);
        const signingKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            signingKey,
            new TextEncoder().encode(tokenData)
        );

        const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
            .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

        const authToken = `${tokenData}.${encodedSignature}`;

        // 2. Enviar a requisição para o Push Service (Google, Mozilla, etc)
        // Enviamos um Push Vazio (sem corpo) para evitar a necessidade de criptografia AES-GCM complexa no Worker.
        // O Service Worker receberá o evento e mostrará a mensagem padrão.
        const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
                'TTL': '60',
                'Authorization': `WebPush ${authToken}`,
                'Urgency': 'high'
            },
            body: null
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Push delivery failed (${response.status}):`, errorText);

            // Se o endpoint não for mais válido, removemos a subscrição
            if (response.status === 410 || response.status === 404) {
                await queryDB("DELETE FROM push_subscriptions WHERE subscription->>'endpoint' = $1", [subscription.endpoint], env);
            }
        }

    } catch (err) {
        console.error("🔥 Error sending web push:", err);
    }
}

export async function notifyUser(userId, title, message, env) {
    try {
        const { rows } = await queryDB(
            "SELECT subscription FROM push_subscriptions WHERE user_id = $1",
            [userId],
            env
        );

        const payload = { title, body: message, url: '/' };

        for (const row of rows) {
            const sub = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription;
            // Usamos waitUntil para não travar a resposta da requisição original
            await sendWebPush(sub, payload, env);
        }
    } catch (err) {
        console.error("NotifyUser error:", err);
    }
}
