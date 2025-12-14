import { logAudit } from './audit.js';

const VPN_ASNS = [
    'AS60068', 'AS20473', 'AS29073', 'AS31109', 'AS32934', 'AS40027', 'AS43350',
    'AS46844', 'AS49697', 'AS51167', 'AS60068', 'AS60781', 'AS61889', 'AS63062',
    'AS63949', 'AS20473', 'AS29073', 'AS31109', 'AS32934', 'AS40027', 'AS43350'
];

const VPN_KEYWORDS = [
    'vpn', 'proxy', 'tor', 'anonymizer', 'anonymizing', 'hide', 'mask',
    'privacy', 'secure', 'shield', 'guard', 'expressvpn', 'nordvpn', 'surfshark',
    'cyberghost', 'pia', 'private internet', 'windscribe', 'tunnelbear', 'hotspot',
    'datacenter', 'hosting', 'server', 'cloud', 'aws', 'azure', 'gcp', 'digitalocean',
    'linode', 'vultr', 'ovh', 'hetzner', 'contabo', 'leaseweb', 'online.net'
];

async function checkVPNShodan(ip) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`https://internetdb.shodan.io/${ip}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data.tags && (data.tags.includes("vpn") || data.tags.includes("proxy") || data.tags.includes("tor"))) {
                console.log(`🚫 VPN detectada via Shodan: ${ip}`);
                return true;
            }
        }
    } catch (err) {
    }
    return false;
}

async function checkVPNIPAPI(ip) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`https://ipapi.co/${ip}/json/`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data.org && VPN_KEYWORDS.some(kw => data.org.toLowerCase().includes(kw))) {
                console.log(`🚫 VPN detectada via ipapi.co (org): ${data.org}`);
                return true;
            }
            if (data.vpn === true || data.proxy === true || data.tor === true) {
                console.log(`🚫 VPN detectada via ipapi.co: ${ip}`);
                return true;
            }
        }
    } catch (err) {
    }
    return false;
}

async function checkVPNIPAPICom(ip) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,isp,org,as,asname,proxy,hosting`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
                if (data.proxy === true || data.hosting === true) {
                    console.log(`🚫 VPN detectada via ip-api.com: ${ip}`);
                    return true;
                }
                const ispOrg = `${data.isp || ''} ${data.org || ''} ${data.asname || ''}`.toLowerCase();
                if (VPN_KEYWORDS.some(kw => ispOrg.includes(kw))) {
                    console.log(`🚫 VPN detectada via ip-api.com (ISP): ${ispOrg}`);
                    return true;
                }
            }
        }
    } catch (err) {
    }
    return false;
}

async function checkVPNCloudflare(ip, c) {
    return false;
}

export async function isVPN(ip, c) {
    try {
        const proxyHeaders = [
            "X-Forwarded-For",
            "X-ProxyUser-Ip",
            "X-Proxy-ID",
            "Via",
            "Forwarded",
            "X-Forwarded",
            "X-Forwarded-Host",
            "Client-IP",
            "WL-Proxy-Client-IP",
            "Proxy-Client-IP",
            "X-Real-IP",
            "X-Originating-IP",
            "X-Remote-IP",
            "X-Remote-Addr"
        ];

        for (const header of proxyHeaders) {
            const value = c.req.header(header);
            if (value) {
                if (value.includes(",")) {
                    console.log(`🚫 VPN detectada via header ${header}: ${value}`);
                    return true;
                }
                if (value.toLowerCase().includes('proxy') || value.toLowerCase().includes('vpn')) {
                    console.log(`🚫 VPN detectada via header suspeito ${header}: ${value}`);
                    return true;
                }
            }
        }

        const cfThreatScore = c.req.header("CF-Threat-Score");
        if (cfThreatScore && parseInt(cfThreatScore) > 5) {
            console.log(`🚫 VPN detectada via CF Threat Score: ${cfThreatScore}`);
            return true;
        }

        const cfIsTor = c.req.header("CF-Is-Tor");
        if (cfIsTor === "1") {
            console.log("🚫 Conexão TOR detectada via Cloudflare");
            return true;
        }

        const vpnRanges = [
            "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.",
            "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.",
            "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.",
            "127.", "169.254.", "::1", "fc00:", "fe80:"
        ];

        for (const range of vpnRanges) {
            if (ip.startsWith(range)) {
                console.log(`🚫 IP privado detectado: ${ip}`);
                return true;
            }
        }

        const checks = await Promise.allSettled([
            checkVPNShodan(ip),
            checkVPNIPAPI(ip),
            checkVPNIPAPICom(ip),
            checkVPNCloudflare(ip, c)
        ]);

        for (const check of checks) {
            if (check.status === 'fulfilled' && check.value === true) {
                return true;
            }
        }

        const cfASN = c.req.header("CF-Connecting-ASN");
        if (cfASN) {
            const asnString = `AS${cfASN}`;
            if (VPN_ASNS.includes(asnString)) {
                console.log(`🚫 VPN detectada via ASN conhecido: ${asnString}`);
                return true;
            }
        }

        const cfISP = c.req.header("CF-Connecting-ASN");
        if (cfISP) {
            const ispLower = String(cfISP).toLowerCase();
            for (const keyword of VPN_KEYWORDS) {
                if (ispLower.includes(keyword)) {
                    console.log(`🚫 VPN detectada via ISP suspeito: ${cfISP}`);
                    return true;
                }
            }
        }

        return false;
    } catch (err) {
        console.error("⚠️ Erro ao verificar VPN:", err.message);
        return true;
    }
}

export async function blockVPN(c, next) {
    const cfConnectingIP = c.req.header("CF-Connecting-IP");
    const xForwardedFor = c.req.header("X-Forwarded-For");
    const xRealIP = c.req.header("X-Real-IP");
    let realIP = cfConnectingIP || xRealIP || "unknown";

    if (xForwardedFor && !cfConnectingIP) {
        realIP = xForwardedFor.split(",")[0].trim();
    }

    const vpnDetected = await isVPN(realIP, c);

    if (vpnDetected) {
        await logAudit(null, "VPN_BLOCKED", { ip: realIP }, c);
        return c.json(
            {
                error: "VPN/Proxy detectado. Desative sua VPN para acessar o SINOPINHAS.",
                blocked: true,
            },
            403
        );
    }

    return await next();
}
