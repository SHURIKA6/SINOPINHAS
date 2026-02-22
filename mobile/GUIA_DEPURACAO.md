# 📱 Guia de Depuração - SINOPINHAS Mobile

## 🚀 Como Rodar o App no Celular

### Pré-requisitos

#### 1. **Configuração do Dispositivo Android**
- ✅ Habilitar **Modo Desenvolvedor**:
  1. Vá em `Configurações` → `Sobre o telefone`
  2. Toque 7 vezes em `Número da versão` ou `Versão do MIUI`
  3. O modo desenvolvedor será ativado

- ✅ Habilitar **Depuração USB**:
  1. Vá em `Configurações` → `Opções do desenvolvedor`
  2. Ative `Depuração USB`
  3. Ative `Instalação via USB` (se disponível)

- ✅ Conectar o celular ao computador via USB

#### 2. **Ferramentas Necessárias**
- ✅ Android Studio instalado (ou Android SDK)
- ✅ ADB (Android Debug Bridge) configurado
- ✅ Node.js e npm instalados
- ✅ Java JDK 17 instalado

### 🔧 Verificação Inicial

#### Verificar se o dispositivo está conectado:
```bash
adb devices
```

**Saída esperada:**
```
List of devices attached
ABCD1234        device
```

Se aparecer "unauthorized", aceite a depuração USB no celular.

---

## 🏗️ Build e Instalação

### Método 1: Script Automatizado (Recomendado)

#### Windows:
```bash
cd android
build-debug.bat
```

#### Linux/Mac:
```bash
cd android
chmod +x build-debug.sh
./build-debug.sh
```

### Método 2: Manual

#### Passo 1: Limpar build anterior
```bash
cd android
./gradlew clean
```

#### Passo 2: Construir APK de depuração
```bash
./gradlew assembleDebug
```

#### Passo 3: Instalar no dispositivo
```bash
./gradlew installDebug
```

#### Passo 4: Configurar ponte para Metro Bundler
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097
```

### Método 3: Via Expo
```bash
# Na raiz do projeto mobile
npm start

# Pressione 'a' para abrir no Android
# ou
npx expo run:android
```

---

## 🐛 Depuração

### 1. **Iniciar o Metro Bundler**
Na raiz do projeto mobile:
```bash
npm start
```

### 2. **Abrir o App no Celular**
O app já está instalado, basta abrir "SINOPINHAS" no menu de aplicativos.

### 3. **Acessar Menu de Desenvolvedor**
No app, agite o celular ou pressione `Ctrl+M` (emulador) para abrir o menu de desenvolvedor.

**Opções úteis:**
- **Reload** - Recarregar o app
- **Debug** - Abrir debugger no Chrome
- **Element Inspector** - Inspecionar elementos da UI
- **Performance Monitor** - Ver FPS e uso de memória

### 4. **Logs em Tempo Real**
```bash
# Ver todos os logs
adb logcat

# Filtrar apenas logs do React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Logs mais limpos
npx react-native log-android
```

---

## ⚠️ Solução de Problemas

### Erro: "No devices found"
**Causa:** Celular não detectado pelo ADB

**Solução:**
1. Reconectar cabo USB
2. Verificar se a depuração USB está habilitada
3. Instalar drivers USB do fabricante
4. Executar:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Erro: "Build failed"
**Causa:** Problemas no Gradle ou dependências

**Solução:**
1. Limpar cache do Gradle:
   ```bash
   cd android
   ./gradlew clean
   rm -rf .gradle
   ./gradlew --stop
   ```

2. Limpar cache do npm:
   ```bash
   cd ..
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```

3. Reconstruir:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

### Erro: "Metro Bundler connection failed"
**Causa:** Dispositivo não consegue acessar o servidor

**Solução:**
1. Verificar se o Metro está rodando:
   ```bash
   npm start
   ```

2. Reconfigurar ponte:
   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:8097 tcp:8097
   ```

3. No menu do desenvolvedor, ir em `Settings` → `Debug server host & port` e deixar em branco ou configurar IP:porta do PC.

### Erro: "Unable to load script"
**Causa:** Bundle não foi gerado ou não está acessível

**Solução:**
1. Reiniciar Metro Bundler:
   ```bash
   npm start -- --reset-cache
   ```

2. No app, abrir menu desenvolvedor → `Reload`

### Erro: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Causa:** Versão antiga do app instalada

**Solução:**
```bash
# Desinstalar versão antiga
adb uninstall com.sinopinhas.app

# Reinstalar
cd android
./gradlew installDebug
```

### Tela branca ou app crasha
**Causa:** Erro no código JavaScript

**Solução:**
1. Ver logs:
   ```bash
   npx react-native log-android
   ```

2. Verificar erros no Metro Bundler

3. Limpar cache:
   ```bash
   npm start -- --reset-cache
   ```

---

## 📊 Monitoramento de Performance

### Ver FPS e uso de memória
No menu do desenvolvedor → `Show Performance Monitor`

### Analisar performance de componentes
No menu do desenvolvedor → `Enable Systrace`

### React DevTools
```bash
npm install -g react-devtools
react-devtools
```

No app, abrir menu → `Debug`

---

## 🔥 Hot Reload e Fast Refresh

### Configurações Recomendadas
No menu do desenvolvedor:
- ✅ `Enable Fast Refresh` - Recarga automática ao salvar
- ✅ `Enable Live Reload` - Recarregar ao mudar código nativo

### Como usar:
1. Faça alterações no código JavaScript
2. Salve o arquivo (Ctrl+S)
3. O app atualiza automaticamente

---

## 📦 Gerar APK para Testes

### APK de Debug (com Metro Bundler)
```bash
cd android
./gradlew assembleDebug
```
**Localização:** `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Release (standalone)
```bash
cd android
./gradlew assembleRelease
```
**Localização:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 🌐 Configuração de API

### Conectar ao backend local

**Se o backend está rodando no PC:**

1. Descobrir IP do PC na rede local:
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig
   ```

2. Atualizar URL da API em `services/api.js`:
   ```javascript
   const API_URL = 'http://192.168.1.100:3000'; // Seu IP local
   ```

3. Garantir que o firewall permite conexões na porta 3000

**Ou usar adb reverse:**
```bash
adb reverse tcp:3000 tcp:3000
```
E manter `http://localhost:3000` na API

---

## 📝 Checklist de Depuração

Antes de começar:
- [ ] Dispositivo conectado via USB
- [ ] Depuração USB habilitada
- [ ] `adb devices` mostra o dispositivo
- [ ] Metro Bundler rodando (`npm start`)
- [ ] App instalado no dispositivo
- [ ] `adb reverse` configurado
- [ ] Backend rodando (se necessário)

---

## 🆘 Comandos Úteis

```bash
# Listar dispositivos conectados
adb devices

# Ver logs em tempo real
adb logcat

# Limpar logs
adb logcat -c

# Reiniciar ADB
adb kill-server && adb start-server

# Desinstalar app
adb uninstall com.sinopinhas.app

# Instalar APK manualmente
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Configurar ponte para servidor
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000

# Capturar screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Gravar tela
adb shell screenrecord /sdcard/recording.mp4

# Ver informações do dispositivo
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
```

---

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs do Metro Bundler
2. Verifique os logs do Android: `adb logcat`
3. Consulte a documentação do Expo: https://docs.expo.dev
4. Consulte a documentação do React Native: https://reactnative.dev

---

**Última atualização:** 21 de fevereiro de 2026
