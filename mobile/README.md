# @mobile - App Instagram Clone

## Estrutura do Projeto

```
mobile/
├── app/
│   ├── _layout.js                 # Root layout com navegação
│   ├── (auth)/
│   │   ├── _layout.js             # Auth stack navigator
│   │   ├── login.js               # Tela de login
│   │   └── register.js            # Tela de registro
│   ├── (tabs)/
│   │   ├── _layout.js             # Tab navigator
│   │   ├── index.js               # Feed principal
│   │   ├── search.js              # Busca/Explorar
│   │   ├── upload.js              # Postar vídeo
│   │   └── profile.js             # Perfil do usuário
│   ├── index.js                   # Home anterior (depreciado)
│   ├── login.js                   # Login anterior (depreciado)
│   └── register.js                # Register anterior (depreciado)
├── components/
│   ├── Stories.js                 # Componente de stories
│   └── StoryViewer.js             # Visualizador de stories
├── context/
│   └── AuthContext.js             # Contexto de autenticação
├── services/
│   └── api.js                     # Serviço de API
├── android/                       # Pasta nativa Android
│   └── app/src/main/
│       ├── AndroidManifest.xml    # Permissões Android
│       └── java/com/anonymous/mobile/
├── App.js                         # Entry point
├── app.json                       # Config Expo
├── package.json                   # Dependências
├── .env                           # Variáveis de ambiente
├── .env.example                   # Template de env
├── tailwind.config.js             # Config Tailwind
├── nativewind.config.js           # Config NativeWind
└── input.css                      # Estilos Tailwind

```

## Recursos Implementados

✅ **Navegação Completa**
- Root layout com Expo Router
- Stack navigator para auth (login/register)
- Tab navigator para app autenticada (feed, explorar, postar, perfil)

✅ **Autenticação**
- Contexto de autenticação com SecureStore
- Login e registro
- Logout
- Verificação de sessão

✅ **Telas**
- **Feed**: Vídeos com stories, curtidas, comentários
- **Explorar**: Busca por vídeos/usuários
- **Upload**: Seleção e publicação de vídeos
- **Perfil**: Dados do usuário com logout

✅ **Estilos**
- Tailwind CSS com NativeWind
- Dark theme (#0f0d15)
- Lucide icons

✅ **Backend**
- Integração com API via axios
- Interceptadores para token
- Endpoints: login, register, videos, stories, upload, like, comment

✅ **Permissões Android**
- Internet, câmera, galeria, áudio

## 🚀 Como Rodar e Mobilar

### 1. Desenvolvimento Local
```bash
cd mobile
npm install
npm start
# Pressione 'a' para Android ou escaneie o QR Code com Expo Go
```

### 2. Gerar Assets (Ícones e Splash)
Antes de gerar o build, crie seus ícones em `mobile/assets/`:
- `icon.png` (1024x1024)
- `splash-icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024)

### 3. Build para Produção (Android)
Existem duas formas de gerar o APK/AAB:

**Opção A: Via EAS (Recomendado)**
```bash
npm install -g eas-cli
eas login
eas build --platform android
```

**Opção B: Build Local (Pre-build)**
```bash
# Gera as pastas nativas (android/)
npx expo prebuild

# Compila o projeto (precisa do Android Studio / SDK configurado)
npm run android -- --mode release
```

### 4. Permissões Android
O `AndroidManifest.xml` já está configurado com:
- Internet, Câmera, Galeria, Áudio e Gravação.

### 5. Variáveis de Ambiente
Copie `.env.example` para `.env` e ajuste a URL da API:
```env
EXPO_PUBLIC_API_URL=https://backend.fernandoriaddasilvaribeiro.workers.dev
```

## 📱 Estrutura do App

- **(auth)/**: Login e Registro (Stack)
- **(tabs)/**: Feed, Explorar, Upload, Perfil (Tabs)
- **services/api.js**: Configuração do Axios com interceptors de Token
- **context/AuthContext.js**: Gerenciamento global de sessão (SecureStore)
- **nativewind**: Estilização com classes Tailwind

---
**Status**: ✅ Pronto para Mobilar (17/02/2026)
