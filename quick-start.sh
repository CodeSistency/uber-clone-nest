#!/bin/bash

# 🚀 Quick Start Script para Configuración de Notificaciones
# Ejecuta este script para configurar todo automáticamente

echo "🚀 INICIANDO CONFIGURACIÓN DE NOTIFICACIONES"
echo "==========================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Instálalo primero."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Instálalo primero."
    exit 1
fi

echo "✅ Node.js y npm detectados"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas"
echo ""

# Ejecutar script de configuración
echo "⚙️  Ejecutando configuración de servicios..."
node setup-notifications.js

echo ""
echo "🧪 ¿Quieres ejecutar las pruebas ahora? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🧪 Ejecutando pruebas de notificaciones..."
    node test-notifications.js
else
    echo ""
    echo "ℹ️  Para ejecutar pruebas más tarde:"
    echo "   node test-notifications.js"
fi

echo ""
echo "📚 DOCUMENTACIÓN DISPONIBLE:"
echo "============================"
echo "📖 Guía completa: NOTIFICATIONS-SETUP-GUIDE.md"
echo "🔧 Configuración: setup-notifications.js"
echo "🧪 Pruebas: test-notifications.js"
echo ""

echo "🎯 PRÓXIMOS PASOS:"
echo "==================="
echo "1. Edita el archivo .env con tus credenciales reales"
echo "2. Configura Firebase y Twilio siguiendo la guía"
echo "3. Inicia la aplicación: npm run start:dev"
echo "4. Registra tokens de dispositivo para push notifications"
echo ""

echo "🎉 ¡Configuración completada!"
echo "Lee NOTIFICATIONS-SETUP-GUIDE.md para instrucciones detalladas."
