// lib/fingerprint.js - CAPTURA DE FINGERPRINT DO DISPOSITIVO

export function getDeviceFingerprint() {
  try {
    const fingerprint = {
      // Informações básicas
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      
      // Navegador e SO
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,
      
      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Hardware
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      
      // Conexão
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,
      
      // Plugins (Chrome desabilitou, mas mantemos para compatibilidade)
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
      
      // Canvas Fingerprint (único por GPU/driver)
      canvas: getCanvasFingerprint(),
      
      // WebGL Fingerprint (GPU info)
      webgl: getWebGLFingerprint(),
      
      // Touch support
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      
      // Battery (se disponível)
      battery: null, // Será preenchido async
      
      // Timestamp
      timestamp: Date.now()
    };

    // Gerar hash único
    const fpString = JSON.stringify(fingerprint);
    fingerprint.hash = simpleHash(fpString);

    return fingerprint;
  } catch (err) {
    console.error('Erro ao gerar fingerprint:', err);
    return { hash: 'error', error: err.message };
  }
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = 'SINOPINHAS.FINGERPRINT.2025';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(text, 4, 17);
    
    return canvas.toDataURL();
  } catch (err) {
    return 'error';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'not-supported';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    
    return `${vendor}|${renderer}`;
  } catch (err) {
    return 'error';
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Função para enviar fingerprint ao servidor
export async function sendFingerprint(action, metadata = {}) {
  try {
    const fingerprint = getDeviceFingerprint();
    
    // Adicionar battery info se disponível
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      fingerprint.battery = {
        charging: battery.charging,
        level: battery.level
      };
    }

    return {
      ...metadata,
      fingerprint: fingerprint.hash,
      screen: fingerprint.screen,
      language: fingerprint.language,
      timezone: fingerprint.timezone,
      fullFingerprint: fingerprint
    };
  } catch (err) {
    return metadata;
  }
}
