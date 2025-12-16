export async function getDeviceFingerprint() {
  try {
    const fingerprint = {
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      webglVendor: getWebGLVendor(),

      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      cpuClass: navigator.cpuClass || 'unknown',

      screen: `${screen.width}x${screen.height}`,
      availScreen: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,

      audioFingerprint: getAudioFingerprint(),

      fonts: getFontFingerprint(),

      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,

      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),

      storageQuota: null,

      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,

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

      webdriver: navigator.webdriver || false,
      languages_length: navigator.languages ? navigator.languages.length : 0,
      permissions: null,
    };

    try {
      fingerprint.inIframe = window.self !== window.top;
    } catch (e) {
      fingerprint.inIframe = true;
    }

    // Captura geolocalização precisa (GPS) se permitido
    try {
      fingerprint.gps = await getGeolocation();
    } catch (e) {
      fingerprint.gps = { error: e.message };
    }

    const fpString = JSON.stringify(fingerprint);
    fingerprint.hash = await generateStrongHash(fpString);
    fingerprint.secondaryHash = simpleHash(
      `${fingerprint.canvas}|${fingerprint.webgl}|${fingerprint.audioFingerprint}`
    );

    return fingerprint;
  } catch (err) {
    console.error('Erro ao gerar fingerprint:', err);
    return { hash: 'error', error: err.message };
  }
}

// Helper para obter geolocalização com alta precisão
function getGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ status: 'not_supported' });
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp
      }),
      (err) => resolve({ status: 'denied_or_error', code: err.code, message: err.message }),
      {
        enableHighAccuracy: true,
        timeout: 8000, // Wait up to 8s for high accuracy
        maximumAge: 0
      }
    );
  });
}

async function generateStrongHash(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Erro ao gerar hash forte:', err);
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

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SINOPINHAS', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('SINOPINHAS', 4, 17);
    return canvas.toDataURL();
  } catch (err) {
    return 'error';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'not_supported';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };
    }
    return {
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };
  } catch (err) {
    return 'error';
  }
}

function getWebGLVendor() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'not_supported';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }
    return gl.getParameter(gl.VENDOR);
  } catch (err) {
    return 'error';
  }
}

function getAudioFingerprint() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'not_supported';

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

    let audioHash = '';
    scriptProcessor.onaudioprocess = function (bins) {
      const output = bins.inputBuffer.getChannelData(0);
      let hash = 0;
      for (let i = 0; i < output.length; i++) {
        hash += Math.abs(output[i]);
      }
      audioHash = hash.toString(36);
    };

    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);

    return audioHash || 'timeout';
  } catch (err) {
    return 'error';
  }
}

function getFontFingerprint() {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console', 'Tahoma', 'Courier', 'Lucida Sans Unicode'
  ];

  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';
  const h = document.getElementsByTagName('body')[0];

  const baseWidths = {};
  const baseHeights = {};

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  baseFonts.forEach(baseFont => {
    context.font = `${testSize} ${baseFont}`;
    baseWidths[baseFont] = context.measureText(testString).width;
    baseHeights[baseFont] = context.measureText(testString).height;
  });

  const detected = [];
  testFonts.forEach(font => {
    let detected_font = false;
    baseFonts.forEach(baseFont => {
      const name = `${font}, ${baseFont}`;
      context.font = `${testSize} ${name}`;
      const width = context.measureText(testString).width;
      const height = context.measureText(testString).height;

      if (width !== baseWidths[baseFont] || height !== baseHeights[baseFont]) {
        if (!detected_font) {
          detected.push(font);
          detected_font = true;
        }
      }
    });
  });

  return detected;
}

function getPluginFingerprint() {
  try {
    const plugins = [];
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }
    return plugins;
  } catch (err) {
    return [];
  }
}
