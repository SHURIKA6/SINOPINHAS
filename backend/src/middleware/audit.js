import { queryDB } from '../db/index.js';

export async function logAudit(user_id, action, meta = {}, c) {
    try {
        const cfConnectingIP = c.req.header("CF-Connecting-IP");
        const xForwardedFor = c.req.header("X-Forwarded-For");
        const xRealIP = c.req.header("X-Real-IP");

        let realIP = cfConnectingIP || xRealIP || "unknown";
        if (xForwardedFor && !cfConnectingIP) {
            realIP = xForwardedFor.split(",")[0].trim();
        }

        const cfCountry = c.req.header("CF-IPCountry") || null;
        const cfCity = c.req.header("CF-IPCity") || null;
        const cfRegion = c.req.header("CF-Region") || null;
        const cfTimezone = c.req.header("CF-Timezone") || null;
        const cfLatitude = c.req.header("CF-IPLatitude") || null;
        const cfLongitude = c.req.header("CF-IPLongitude") || null;
        const cfASN = c.req.header("CF-Connecting-ASN") || null;

        const userAgent = c.req.header("User-Agent") || "unknown";
        const acceptLanguage = c.req.header("Accept-Language") || null;

        let os = "Unknown";
        if (userAgent.match(/Windows NT 10\.0/i)) os = "Windows 10";
        else if (userAgent.match(/Windows NT 11\.0/i)) os = "Windows 11";
        else if (userAgent.match(/Windows/i)) os = "Windows";
        else if (userAgent.match(/Mac OS X/i)) os = "macOS";
        else if (userAgent.match(/iPhone/i)) os = "iOS (iPhone)";
        else if (userAgent.match(/iPad/i)) os = "iOS (iPad)";
        else if (userAgent.match(/Android/i)) os = "Android";
        else if (userAgent.match(/Linux/i)) os = "Linux";

        let browser = "Unknown";
        if (userAgent.match(/Edg\//i)) browser = "Edge";
        else if (userAgent.match(/Chrome/i) && !userAgent.match(/Edg/i)) browser = "Chrome";
        else if (userAgent.match(/Firefox/i)) browser = "Firefox";
        else if (userAgent.match(/Safari/i) && !userAgent.match(/Chrome/i)) browser = "Safari";
        else if (userAgent.match(/Opera|OPR/i)) browser = "Opera";

        let deviceType = "Desktop";
        if (userAgent.match(/iPhone/i)) deviceType = "iPhone";
        else if (userAgent.match(/iPad/i)) deviceType = "iPad";
        else if (userAgent.match(/Android.*Mobile/i)) deviceType = "Android Mobile";
        else if (userAgent.match(/Android/i)) deviceType = "Android Tablet";
        else if (userAgent.match(/Mobile|Tablet/i)) deviceType = "Mobile";

        let fingerprint = meta?.fingerprint || null;
        if (fingerprint && typeof fingerprint === 'string') {
            fingerprint = fingerprint.substring(0, 255);
        } else if (fingerprint) {
            fingerprint = String(fingerprint).substring(0, 255);
        }

        const screenResolution = meta?.screen || null;
        const browserLanguage = meta?.language || acceptLanguage;
        const clientTimezone = meta?.timezone || cfTimezone;

        let isp = null;
        if (cfASN) {
            isp = `ASN ${cfASN}`;
        }

        const safeUserId = user_id ? parseInt(user_id) : null;

        let detailsJson = JSON.stringify(meta);
        if (detailsJson.length > 50000) {
            console.warn(`⚠️ Details muito grande (${detailsJson.length} chars), truncando...`);
            const essentialMeta = {
                fingerprint: meta?.fingerprint,
                screen: meta?.screen,
                language: meta?.language,
                timezone: meta?.timezone,
                platform: meta?.platform,
                action: meta?.action,
                hash: meta?.hash,
                secondaryHash: meta?.secondaryHash
            };
            detailsJson = JSON.stringify(essentialMeta);
        }

        try {
            await queryDB(
                `INSERT INTO audit_logs (
          user_id, action, ip, user_agent, details, device_type,
          country, city, region, latitude, longitude, asn, isp,
          browser, os, screen_resolution, language, timezone, fingerprint
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                [
                    safeUserId,
                    action,
                    realIP,
                    userAgent,
                    detailsJson,
                    deviceType,
                    cfCountry,
                    cfCity,
                    cfRegion,
                    cfLatitude ? parseFloat(cfLatitude) : null,
                    cfLongitude ? parseFloat(cfLongitude) : null,
                    cfASN,
                    isp,
                    browser,
                    os,
                    screenResolution,
                    browserLanguage,
                    clientTimezone,
                    fingerprint,
                ],
                c.env
            );

            console.log(
                `✅ LOG COMPLETO: ${action} | User: ${safeUserId || "N/A"
                } | IP: ${realIP} | Browser: ${browser} | OS: ${os} | Fingerprint: ${fingerprint ? fingerprint.substring(0, 8) : "N/A"
                }`
            );
        } catch (dbError) {
            console.error("⚠️ Erro ao salvar log no banco:", dbError.message);

            try {
                await queryDB(
                    `INSERT INTO audit_logs (
            user_id, action, ip, user_agent, details, device_type
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [safeUserId, action, realIP, userAgent, JSON.stringify(meta), deviceType],
                    c.env
                );
                console.log(`⚠️ LOG BÁSICO salvo: ${action}`);
            } catch (fallbackError) {
                console.error("❌ Falha total ao salvar log:", fallbackError.message);
            }
        }
    } catch (err) {
        console.error("⚠️ Falha ao gravar log (não crítico):", err.message);
    }
}
