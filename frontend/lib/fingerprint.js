// lib/fingerprint.js - FINGERPRINT AVANÇADO (substitui MAC)

export function getDeviceFingerprint() {
  try {
    const fingerprint = {
      // ==========================================
      // IDENTIFICADORES DE HARDWARE (substituem MAC)
      // ==========================================
      
      // GPU Fingerprint (único por placa de vídeo)
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      webglVendor: getWebGLVendor(),
      
      // CPU e Performance
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      cpuClass: navigator.cpuClass || 'unknown',
      
      // Tela (único por monitor)
      screen: `${screen.width}x${screen.height}`,
      availScreen: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      
      // Audio Fingerprint (único por hardware de áudio)
      audioFingerprint: getAudioFingerprint(),
      
      // Font Fingerprint (fontes instaladas)
      fonts: getFontFingerprint(),
      
      // ==========================================
      // IDENTIFICADORES DE SOFTWARE
      // ==========================================
      
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,
      
      // Timezone (mais preciso que IP)
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      
      // Storage disponível
      storageQuota: null, // Preenchido async
      
      // ==========================================
      // IDENTIFICADORES DE REDE
      // ==========================================
      
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,
      
      // ==========================================
      // IDENTIFICADORES DE DISPOSITIVO
      // ==========================================
      
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      // Bluetooth (se disponível)
      bluetooth: 'bluetooth' in navigator,
      
      // USB (se disponível)
      usb: 'usb' in navigator,
      
      // Sensors (mobile)
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
      
      // Media Devices (câmera/mic)
      mediaDevices: 'mediaDevices' in navigator,
      
      // Plugins
      plugins: getPluginFingerprint(),
      
      // ==========================================
      // IDENTIFICADORES EXTRAS
      // ==========================================
      
      doNotTrack: navigator.doNotTrack || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      javaEnabled: false, // Java tá morto, mas verificamos
      
      // Viewport
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      
      // Timestamp
      timestamp: Date.now(),
      
      // Session info
      sessionStorage: typeof sessionStorage !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
    };

    // Gerar hash único composto
    const fpString = JSON.stringify(fingerprint);
    fingerprint.hash = generateStrongHash(fpString);
    
    // Hash secundário (backup)
    fingerprint.secondaryHash = simpleHash(
      `${fingerprint.canvas}|${fingerprint.webgl}|${fingerprint.audioFingerprint}`
    );

    return fingerprint;
  } catch (err) {
    console.error('Erro ao gerar fingerprint:', err);
    return { hash: 'error', error: err.message };
  }
}

// Canvas Fingerprint (GPU)
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const text = 'SINOPINHAS🔥2025!@#$%^&*()';
    
    canvas.width = 280;
    canvas.height = 60;
    
    ctx.textBaseline = 'top';
    ctx.font = '16px "Arial", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(text, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(text, 4, 17);
    
    // Adicionar formas geométricas para aumentar unicidade
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    
    return canvas.toDataURL();
  } catch (err) {
    return 'canvas-error';
  }
}

// WebGL Fingerprint (GPU completo)
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'webgl-not-supported';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    
    return `${vendor}~~~${renderer}`;
  } catch (err) {
    return 'webgl-error';
  }
}

// WebGL Vendor Info
function getWebGLVendor() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return null;
    
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };
  } catch (err) {
    return null;
  }
}

// Audio Fingerprint (hardware de áudio)
function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'audio-not-supported';
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gainNode = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gainNode.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(0);
    
    const fingerprint = [
      context.sampleRate,
      analyser.fftSize,
      analyser.frequencyBinCount,
      context.state,
      context.baseLatency || 0,
      context.outputLatency || 0
    ].join('|');
    
    oscillator.stop();
    context.close();
    
    return fingerprint;
  } catch (err) {
    return 'audio-error';
  }
}

// Font Fingerprint (fontes instaladas)
function getFontFingerprint() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 
    'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
    'Helvetica', 'Calibri', 'Cambria', 'Consolas', 'Lucida Console'
  ];
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const text = 'mmmmmmmmmmlli';
  
  context.font = '72px monospace';
  const baseWidth = context.measureText(text).width;
  
  const detectedFonts = testFonts.filter(font => {
    context.font = `72px ${font}, monospace`;
    return context.measureText(text).width !== baseWidth;
  });
  
  return detectedFonts.join(',');
}

// Plugin Fingerprint
function getPluginFingerprint() {
  if (!navigator.plugins || navigator.plugins.length === 0) {
    return 'no-plugins';
  }
  
  return Array.from(navigator.plugins)
    .map(p => `${p.name}:${p.filename}`)
    .sort()
    .join('|');
}

// Hash forte (melhor que MD5)
function generateStrongHash(str) {
  let hash = 5381;
  let i = str.length;
  
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  
  return (hash >>> 0).toString(36);
}

// Hash simples (backup)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Função principal para enviar
export async function sendFingerprint(action, metadata = {}) {
  try {
    const fingerprint = getDeviceFingerprint();
    
    // Adicionar storage quota
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      fingerprint.storageQuota = {
        usage: estimate.usage,
        quota: estimate.quota
      };
    }
    
    // Adicionar battery info
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      fingerprint.battery = {
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    }

    return {
      ...metadata,
      fingerprint: fingerprint.hash,
      secondaryFingerprint: fingerprint.secondaryHash,
      screen: fingerprint.screen,
      language: fingerprint.language,
      timezone: fingerprint.timezone,
      fullFingerprint: JSON.stringify(fingerprint)
    };
  } catch (err) {
    console.error('Erro ao capturar fingerprint:', err);
    return {
      ...metadata,
      fingerprint: 'error',
      error: err.message
    };
  }
}
// =====================================================================