@echo off
echo ========================================
echo   SINOPINHAS - Build e Depuracao
echo ========================================
echo.

REM Limpar build anterior
echo [1/4] Limpando build anterior...
call gradlew clean
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao limpar build
    pause
    exit /b %errorlevel%
)
echo.

REM Construir APK de depuracao
echo [2/4] Construindo APK de depuracao...
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao construir APK
    pause
    exit /b %errorlevel%
)
echo.

REM Verificar dispositivo conectado
echo [3/4] Verificando dispositivo conectado...
adb devices
echo.

REM Instalar APK no dispositivo
echo [4/4] Instalando APK no dispositivo...
call gradlew installDebug
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar APK
    echo.
    echo Certifique-se de que:
    echo   - O dispositivo esta conectado via USB
    echo   - A depuracao USB esta habilitada
    echo   - Os drivers USB estao instalados
    pause
    exit /b %errorlevel%
)
echo.

REM Configurar adb reverse para Metro Bundler
echo Configurando ponte para Metro Bundler...
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097

echo.
echo ========================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo O app foi instalado no seu dispositivo.
echo Agora voce pode:
echo   1. Iniciar o Metro Bundler: npm start
echo   2. Abrir o app no seu dispositivo
echo.
pause
