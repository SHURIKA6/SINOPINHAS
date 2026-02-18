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

## Como Usar

### Desenvolvimento
```bash
cd mobile
npm install
npm start
```

### Android
```bash
npm run android
```

### Build Android
```bash
npm run build:android
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
EXPO_PUBLIC_API_URL=https://seu-backend.com
EXPO_PUBLIC_APP_NAME=SINOPINHAS
EXPO_PUBLIC_APP_SCHEME=sinopinhas
```

## Próximos Passos para Android Studio

1. **Gerar Assets**:
   - Criar ícones em múltiplas resoluções
   - Gerar splash screen

2. **Configurar Build**:
   - Gerar keystore assinado
   - Configurar app.json para produção

3. **Testar**:
   - Rodar no emulador Android
   - Testar permissões de câmera/galeria
   - Verificar deep linking

4. **Deploy**:
   - Google Play Store
   - EAS (Expo Application Services)

## Notas Importantes

- O App.js não é mais usado, tudo passa pelo Expo Router
- Autenticação é centralizada no contexto
- Dark theme é padrão
- Tailwind com NativeWind para estilização
- API pode ser customizada no .env
