import { logAudit } from './audit.js';

// ============================================================================
// DETECÇÃO DE VPN - VERSÃO REFINADA
// Objetivo: Bloquear VPNs comerciais e TOR, mas PERMITIR redes educacionais/corporativas
// ============================================================================

// ASNs de provedores de VPN COMERCIAIS conhecidos (não datacenters genéricos)
const VPN_PROVIDER_ASNS = [
    // ExpressVPN, NordVPN, Surfshark, etc.
    'AS60068', // CDN77 (usado por muitas VPNs)
    'AS9009',  // M247 (infraestrutura de VPNs comerciais)
    'AS20473', // Vultr/Choopa (popular para VPNs)
    'AS29073', // Quasi Networks (VPNs)
    'AS43350', // NForce Entertainment
    'AS49981', // WorldStream
    'AS60781', // LeaseWeb UK
    'AS62904', // Eonix
    'AS51167', // Contabo (popular para VPNs baratas)
    'AS206092', // IPVanish
    'AS136787', // Surfshark
];

// Palavras-chave ESPECÍFICAS de VPNs comerciais (não termos genéricos)
const VPN_SPECIFIC_KEYWORDS = [
    'expressvpn', 'nordvpn', 'surfshark', 'cyberghost', 'ipvanish',
    'privatevpn', 'protonvpn', 'mullvad', 'windscribe', 'tunnelbear',
    'hotspot shield', 'hidemyass', 'vyprvpn', 'purevpn', 'strongvpn',
    'zenmate', 'hide.me', 'torguard', 'astrill', 'privatevpn',
    'anonymizer', 'anonymizing', 'tor exit', 'tor relay'
];

// Verificação via Shodan (apenas tags explícitas de VPN/Proxy/TOR)
async function checkVPNShodan(ip) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`https://internetdb.shodan.io/${ip}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            // Apenas bloqueia se for EXPLICITAMENTE marcado como VPN, proxy ou TOR
            if (data.tags && (
                data.tags.includes("vpn") ||
                data.tags.includes("proxy") ||
                data.tags.includes("tor")
            )) {
                console.warn(`🚫 VPN detectada via Shodan: ${ip} - Tags: ${data.tags.join(', ')}`);
                return true;
            }
        }
    } catch (err) {
        // Silencioso - não bloquear se a API falhar
    }
    return false;
}

export async function isVPN(ip, c) {
    try {
        // 1. BLOQUEIO DE TOR (Absoluto - sempre bloquear)
        const cfIsTor = c.req.header("CF-Is-Tor");
        const cfCountry = c.req.header("CF-IPCountry");
        if (cfIsTor === "1" || cfCountry === 'T1') {
            console.warn("🚫 Conexão TOR detectada");
            return true;
        }

        // 2. CF Threat Score MUITO ALTO (apenas ameaças reais, não proxies normais)
        const cfThreatScore = c.req.header("CF-Threat-Score");
        if (cfThreatScore && parseInt(cfThreatScore) > 50) {
            console.warn(`🚫 Ameaça detectada via CF Threat Score: ${cfThreatScore}`);
            return true;
        }

        // 3. ASNs de provedores de VPN comerciais conhecidos
        const cfASN = c.req.header("CF-Connecting-ASN");
        if (cfASN) {
            const asnString = `AS${cfASN}`;
            if (VPN_PROVIDER_ASNS.includes(asnString)) {
                console.warn(`🚫 VPN detectada via ASN de provedor VPN: ${asnString}`);
                return true;
            }
        }

        // 4. Nome do ISP contém nome de VPN comercial
        const cfISP = c.req.header("CF-Connecting-ISP") || c.req.header("CF-ISP");
        if (cfISP) {
            const ispLower = String(cfISP).toLowerCase();
            for (const keyword of VPN_SPECIFIC_KEYWORDS) {
                if (ispLower.includes(keyword)) {
                    console.warn(`🚫 VPN detectada via ISP: ${cfISP}`);
                    return true;
                }
            }
        }

        // 5. Verificação Shodan (apenas para tags explícitas de VPN)
        const shodanResult = await Promise.race([
            checkVPNShodan(ip),
            new Promise(resolve => setTimeout(() => resolve(false), 2000))
        ]);

        if (shodanResult === true) return true;

        // ✅ Se passou por todos os checks, é provavelmente um usuário legítimo
        return false;

    } catch (err) {
        console.error("⚠️ Erro ao verificar VPN:", err.message);
        // Falha aberta - permitir acesso se houver erro
        return false;
    }
}

export async function blockVPN(c, next) {
    const cfConnectingIP = c.req.header("CF-Connecting-IP");
    const xForwardedFor = c.req.header("X-Forwarded-For");
    const xRealIP = c.req.header("X-Real-IP");

    // Pegar o IP real (CF-Connecting-IP é o mais confiável quando usando Cloudflare)
    let realIP = cfConnectingIP || xRealIP || "unknown";

    // Se não tiver CF header, usar o primeiro IP do X-Forwarded-For
    if (!cfConnectingIP && xForwardedFor) {
        realIP = xForwardedFor.split(",")[0].trim();
    }

    // Exceção: Permitir localhost e redes privadas
    if (realIP === '127.0.0.1' ||
        realIP.startsWith('192.168.') ||
        realIP.startsWith('10.') ||
        (() => {
            // 172.16.0.0 — 172.31.255.255 (RFC 1918)
            const parts = realIP.split('.');
            if (parts[0] === '172') {
                const second = parseInt(parts[1], 10);
                return second >= 16 && second <= 31;
            }
            return false;
        })()) {
        return await next();
    }

    const vpnDetected = await isVPN(realIP, c);

    if (vpnDetected) {
        await logAudit(null, "VPN_BLOCKED", { ip: realIP }, c);
        return c.json(
            {
                error: "Acesso negado. VPN ou TOR detectada. Por favor, desative sua VPN para acessar o site.",
                blocked: true,
            },
            403
        );
    }

    return await next();
}
