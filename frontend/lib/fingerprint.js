export async function getDeviceFingerprint() {
  try {
    // Coleta paralela de sinais para performance
    const [
      canvas,
      webgl,
      audio,
      fonts,
      permissions,
      battery
    ] = await Promise.all([
      getCanvasFingerprint(),
      getWebGLFingerprint(),
      getAudioFingerprint(),
      getFontFingerprint(),
      getPermissionsFingerprint(),
      getBatteryFingerprint()
    ]);

    const fingerprint = {
      // Sinais Gráficos (GPU & Renderização)
      canvas,
      webgl: webgl.hash,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,

      // Sinais de Áudio (Driver de Som)
      audio,

      // Hardware e Sistema
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      cpuClass: navigator.cpuClass || 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      languages: navigator.languages?.join(',') || navigator.language,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      screen: `${screen.width}x${screen.height}`,
      availScreen: `${screen.availWidth}x${screen.availHeight}`,

      // Sinais Comportamentais e Experimentais
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,

      // Sensores
      sensors: [
        'bluetooth' in navigator ? 'BT' : '',
        'usb' in navigator ? 'USB' : '',
        'accelerometer' in window ? 'ACC' : '',
        'gyroscope' in window ? 'GYR' : ''
      ].filter(Boolean).join(','),

      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      // Fontes Instaladas (Vetor de Detecção)
      fonts: fonts.join(','),

      // Permissões e Bateria (Se disponível)
      permissions: permissions,
      battery: battery, // Charging status, level (bucketed)

      // Indícios de Automação
      webdriver: navigator.webdriver || false,
      timestamp: Date.now()
    };

    // Detecção de Iframe
    try {
      fingerprint.inIframe = window.self !== window.top;
    } catch (e) {
      fingerprint.inIframe = true;
    }

    // Geolocalização (Opcional e Lenta - Mantida como promessa separada se necessário, mas aqui simplificada para não bloquear)
    // Removido bloqueio de GPS para não alertar permissão logo de cara, 
    // a menos que usuário já tenha dado permissão anteriormente.

    const fpString = JSON.stringify(fingerprint);

    // Hash Principal (SHA-256)
    fingerprint.hash = await generateStrongHash(fpString);

    // Hash Secundário (Gráfico/Áudio - Mais estável contra updates de browser)
    fingerprint.secondaryHash = simpleHash(
      `${fingerprint.canvas}|${fingerprint.webgl}|${fingerprint.audio}`
    );

    return fingerprint;
  } catch (err) {
    console.error('Erro fatal no fingerprint:', err);
    return { hash: 'error', error: err.message };
  }
}

// --- Forensic Canvas Fingerprint ---
// Desenha emojis, gradientes, e formas complexas que variam sutilmente entre GPUs
async function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 280;
    canvas.height = 60;

    // Fundo com Gradiente
    let grd = ctx.createLinearGradient(0, 0, 200, 0);
    grd.addColorStop(0, "red");
    grd.addColorStop(1, "white");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 280, 60);

    // Texto Complexo (Combina fontes e estilos)
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Sinopinhas Forensic v1.0 🤖", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Sinopinhas Forensic v1.0 🤖", 4, 17);

    // Winding Rule & Blend Modes (Teste de Renderização)
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(255,0,255)";
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgb(0,255,255)";
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgb(255,255,0)";
    ctx.beginPath();
    ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Emojis (Dependem muito do OS/Browser)
    ctx.font = "30px Arial";
    ctx.fillText("👮‍♂️🕵️‍♂️🔒", 200, 40);

    return canvas.toDataURL(); // A string base64 é a "assinatura" visual
  } catch (e) {
    return 'error';
  }
}

// --- Audio Dynamics Fingerprint ---
// Usa compressão de áudio para identificar variações no hardware de som
async function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'not_supported';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    const gain = context.createGain();

    // Configuração específica para estressar o compressor
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.reduction.value = -20;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    oscillator.connect(compressor);
    compressor.connect(gain);
    gain.connect(context.destination);

    oscillator.start(0);

    // Medimos o resultado da compressão (muito variável entre hardwares)
    const fingerprint = await new Promise(resolve => {
      setTimeout(() => {
        const output = compressor.reduction.value; // Valor chave
        oscillator.stop();
        context.close();
        resolve(output);
      }, 50);
    });

    return fingerprint.toString();
  } catch (e) {
    return 'error';
  }
}

// --- WebGL Extensions & Vendor ---
async function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { hash: 'not_supported' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    // Lista todas as extensões suportadas (Ordem e quantidade variam por GPU)
    const extensions = gl.getSupportedExtensions()?.join(',') || '';

    // Aliased Line Width Range
    const aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE).join('-');
    const aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE).join('-');

    const rawString = `${vendor}|${renderer}|${extensions}|${aliasedLineWidthRange}|${aliasedPointSizeRange}`;
    const hash = simpleHash(rawString);

    return { hash, vendor, renderer };
  } catch (e) {
    return { hash: 'error' };
  }
}

// --- Battery Status (Experimental) ---
async function getBatteryFingerprint() {
  try {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      return {
        charging: battery.charging,
        headers: battery.level, // Nível da bateria pode ajudar a correlacionar sessões curtas
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    }
    return 'not_supported';
  } catch (e) {
    return 'error';
  }
}

// --- Permissions Test ---
async function getPermissionsFingerprint() {
  try {
    if (!navigator.permissions) return 'not_supported';
    const permissions = ['geolocation', 'notifications', 'camera', 'microphone'];
    const results = {};

    // Check permissions without asking
    await Promise.all(permissions.map(async (name) => {
      try {
        const status = await navigator.permissions.query({ name });
        results[name] = status.state;
      } catch (e) {
        results[name] = 'error';
      }
    }));
    return results;
  } catch (e) {
    return 'error';
  }
}

// --- Font Fingerprint (Mantido Simplificado) ---
async function getFontFingerprint() {
  // Lista reduzida para performance, mas com fontes chave Windows/Mac/Linux
  const fontsToCheck = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black',
    'Impact', 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell'
  ];

  // Simplificado para retornar apenas a lista detectada simulada ou real se implementarmos a medição completa
  // Por brevidade/performance neste upgrade, focaremos nos outros sinais que são mais fortes. 
  // Mas para manter compatibilidade, vamos retornar uma string mockada baseada no OS se a medição falhar,
  // ou implementar a medição real se necessário. 
  // VOU IMPLEMENTAR UMA MEDIÇÃO RÁPIDA:

  await document.fonts.ready;
  const detected = [];

  const body = document.body;
  const span = document.createElement('span');
  span.style.fontSize = '72px';
  span.style.position = 'absolute';
  span.style.visibility = 'hidden';
  span.innerHTML = 'mmmmmlli';
  body.appendChild(span);

  // Medir fonte padrão (sans-serif)
  span.style.fontFamily = 'sans-serif';
  const defaultWidth = span.offsetWidth;
  const defaultHeight = span.offsetHeight;

  for (const font of fontsToCheck) {
    span.style.fontFamily = `${font}, sans-serif`;
    if (span.offsetWidth !== defaultWidth || span.offsetHeight !== defaultHeight) {
      detected.push(font);
    }
  }

  body.removeChild(span);
  return detected;
}


// --- Hashers ---

async function generateStrongHash(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    return simpleHash(str);
  }
}

function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

