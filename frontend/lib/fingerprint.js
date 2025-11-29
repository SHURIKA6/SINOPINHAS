// lib/fingerprint.js - VERSÃO MELHORADA
export function getDeviceFingerprint() {
  try {
    const fingerprint = {
      // IDENTIFICADORES DE HARDWARE
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      webglVendor: getWebGLVendor(),
      
      // CPU e Performance
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      cpuClass: navigator.cpuClass || 'unknown',
      
      // Tela
      screen: `${screen.width}x${screen.height}`,
      availScreen: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      
      // Audio Fingerprint
      audioFingerprint: getAudioFingerprint(),
      
      // Font Fingerprint
      fonts: getFontFingerprint(),
      
      // IDENTIFICADORES DE SOFTWARE
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,
      
      // Timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Storage disponível
      storageQuota: null,
      
      // IDENTIFICADORES DE REDE
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,
      
      // IDENTIFICADORES DE DISPOSITIVO
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
      mediaDevices: 'mediaDevices' in navigator,
      plugins: getPluginFingerprint(),
      doNotTrack: navigator.doNotTrack || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now(),
      sessionStorage: typeof sessionStorage !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      
      // NOVOS: Detecção de comportamento suspeito
      webdriver: navigator.webdriver || false, // Detecta automação
      languages_length: navigator.languages ? navigator.languages.length : 0,
      permissions: null,
    };

    // Detectar se está em iframe (possível ataque)
    try {
      fingerprint.inIframe = window.self !== window.top;
    } catch (e) {
      fingerprint.inIframe = true;
    }

    const fpString = JSON.stringify(fingerprint);
    fingerprint.hash = generateStrongHash(fpString);
    fingerprint.secondaryHash = simpleHash(
      `${fingerprint.canvas}|${fingerprint.webgl}|${fingerprint.audioFingerprint}`
    );
    
    return fingerprint;
  } catch (err) {
    console.error('Erro ao gerar fingerprint:', err);
    return { hash: 'error', error: err.message };
  }
}

// Restante das funções auxiliares permanecem iguais
// ... (getCanvasFingerprint, getWebGLFingerprint, etc.)

// VALIDAÇÃO DE FINGERPRINT NO BACKEND
export async function validateFingerprint(fingerprint, userId, c) {
  try {
    // Buscar fingerprints anteriores do usuário
    const { rows } = await queryDB(
      `SELECT DISTINCT fingerprint FROM audit_logs 
       WHERE user_id = $1 AND fingerprint IS NOT NULL 
       ORDER BY created_at DESC LIMIT 10`,
      [userId],
      c.env
    );

    const knownFingerprints = rows.map(r => r.fingerprint);
    
    // Se é um novo dispositivo, alertar
    if (knownFingerprints.length > 0 && !knownFingerprints.includes(fingerprint)) {
      await logAudit(userId, 'NEW_DEVICE_DETECTED', { 
        new_fingerprint: fingerprint,
        known_fingerprints: knownFingerprints.length 
      }, c);
      
      // Você pode exigir verificação adicional aqui
      return { isNewDevice: true, requireVerification: false };
    }

    return { isNewDevice: false, requireVerification: false };
  } catch (err) {
    console.error('Erro ao validar fingerprint:', err);
    return { isNewDevice: false, requireVerification: false };
  }
}
