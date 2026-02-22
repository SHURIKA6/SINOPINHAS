#!/bin/bash

echo "========================================"
echo "  SINOPINHAS - Build e Depuração"
echo "========================================"
echo ""

# Limpar build anterior
echo "[1/4] Limpando build anterior..."
./gradlew clean
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao limpar build"
    exit 1
fi
echo ""

# Construir APK de depuração
echo "[2/4] Construindo APK de depuração..."
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir APK"
    exit 1
fi
echo ""

# Verificar dispositivo conectado
echo "[3/4] Verificando dispositivo conectado..."
adb devices
echo ""

# Instalar APK no dispositivo
echo "[4/4] Instalando APK no dispositivo..."
./gradlew installDebug
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao instalar APK"
    echo ""
    echo "Certifique-se de que:"
    echo "  - O dispositivo está conectado via USB"
    echo "  - A depuração USB está habilitada"
    echo "  - Os drivers USB estão instalados"
    exit 1
fi
echo ""

# Configurar adb reverse para Metro Bundler
echo "Configurando ponte para Metro Bundler..."
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8097 tcp:8097

echo ""
echo "========================================"
echo "  BUILD CONCLUÍDO COM SUCESSO!"
echo "========================================"
echo ""
echo "O app foi instalado no seu dispositivo."
echo "Agora você pode:"
echo "  1. Iniciar o Metro Bundler: npm start"
echo "  2. Abrir o app no seu dispositivo"
echo ""
