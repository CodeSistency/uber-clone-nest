#!/bin/bash

# 🚀 Setup Script para Sistema Dual de Notificaciones
# Compatible con Firebase y Expo Notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=".env"
BACKUP_SUFFIX=".backup.$(date +%Y%m%d_%H%M%S)"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        log_error "Este script debe ejecutarse desde la raíz del proyecto Uber Clone"
        exit 1
    fi
}

# Backup existing .env file
backup_env_file() {
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "${ENV_FILE}${BACKUP_SUFFIX}"
        log_info "Backup creado: ${ENV_FILE}${BACKUP_SUFFIX}"
    fi
}

# Check system dependencies
check_dependencies() {
    log_info "Verificando dependencias del sistema..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Instálalo desde https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi

    # Check if PostgreSQL is running (optional)
    if command -v psql &> /dev/null; then
        log_info "PostgreSQL client encontrado"
    else
        log_warning "PostgreSQL client no encontrado. Asegúrate de tener PostgreSQL configurado"
    fi

    log_success "Dependencias del sistema verificadas"
}

# Install notification dependencies
install_dependencies() {
    log_info "Instalando dependencias de notificaciones..."

    # Always install Twilio (required)
    if ! npm list twilio > /dev/null 2>&1; then
        log_info "Instalando Twilio..."
        npm install twilio
    else
        log_info "Twilio ya está instalado"
    fi

    # Ask user which provider to use
    echo
    log_info "Selecciona el proveedor de notificaciones:"
    echo "1) Expo Notifications (Recomendado para apps Expo)"
    echo "2) Firebase (Para apps existentes con Firebase)"
    echo "3) Ambos (Configuración completa)"
    read -p "Elige una opción (1-3): " provider_choice

    case $provider_choice in
        1)
            install_expo_only
            ;;
        2)
            install_firebase_only
            ;;
        3)
            install_both_providers
            ;;
        *)
            log_error "Opción inválida. Instalando Expo por defecto..."
            install_expo_only
            ;;
    esac
}

install_expo_only() {
    log_info "Instalando Expo Notifications..."
    if ! npm list expo-server-sdk > /dev/null 2>&1; then
        npm install expo-server-sdk
        log_success "Expo Notifications instalado"
    else
        log_info "Expo Notifications ya está instalado"
    fi
}

install_firebase_only() {
    log_info "Instalando Firebase..."
    if ! npm list firebase-admin > /dev/null 2>&1; then
        npm install firebase-admin
        log_success "Firebase instalado"
    else
        log_info "Firebase ya está instalado"
    fi
}

install_both_providers() {
    install_expo_only
    install_firebase_only
    log_success "Ambos proveedores instalados"
}

# Configure environment variables
configure_environment() {
    log_info "Configurando variables de entorno..."

    # Create .env file if it doesn't exist
    if [[ ! -f "$ENV_FILE" ]]; then
        touch "$ENV_FILE"
        log_info "Archivo .env creado"
    fi

    # Ask for notification provider
    echo
    log_info "Configuración del proveedor de notificaciones:"
    echo "NOTIFICATION_PROVIDER determina qué servicio usar:"
    echo "- 'expo': Usa Expo Notifications (recomendado)"
    echo "- 'firebase': Usa Firebase Cloud Messaging"
    echo

    read -p "Proveedor a usar (expo/firebase) [expo]: " notification_provider
    notification_provider=${notification_provider:-expo}

    # Validate provider choice
    if [[ "$notification_provider" != "expo" ]] && [[ "$notification_provider" != "firebase" ]]; then
        log_error "Proveedor inválido. Usando 'expo' por defecto."
        notification_provider="expo"
    fi

    # Set provider in .env
    if ! grep -q "^NOTIFICATION_PROVIDER=" "$ENV_FILE"; then
        echo "NOTIFICATION_PROVIDER=$notification_provider" >> "$ENV_FILE"
    else
        sed -i.bak "s/^NOTIFICATION_PROVIDER=.*/NOTIFICATION_PROVIDER=$notification_provider/" "$ENV_FILE"
    fi

    log_info "Proveedor configurado: $notification_provider"

    # Configure provider-specific settings
    case $notification_provider in
        expo)
            configure_expo_settings
            ;;
        firebase)
            configure_firebase_settings
            ;;
    esac

    # Configure Twilio (always required)
    configure_twilio_settings

    # Configure other required settings
    configure_base_settings
}

configure_expo_settings() {
    echo
    log_info "Configuración de Expo Notifications:"
    log_info "El EXPO_PROJECT_ID es opcional pero recomendado para desarrollo"
    echo "Puedes encontrarlo en: https://expo.dev -> Tu proyecto -> Settings"
    echo

    read -p "EXPO_PROJECT_ID (opcional): " expo_project_id
    if [[ -n "$expo_project_id" ]]; then
        if ! grep -q "^EXPO_PROJECT_ID=" "$ENV_FILE"; then
            echo "EXPO_PROJECT_ID=$expo_project_id" >> "$ENV_FILE"
        else
            sed -i.bak "s/^EXPO_PROJECT_ID=.*/EXPO_PROJECT_ID=$expo_project_id/" "$ENV_FILE"
        fi
        log_success "EXPO_PROJECT_ID configurado"
    else
        log_info "EXPO_PROJECT_ID omitido (funcionará de todos modos)"
    fi
}

configure_firebase_settings() {
    echo
    log_info "Configuración de Firebase (requiere service account):"
    log_warning "Necesitas descargar el JSON de Firebase Service Account"
    echo "Ve a: Firebase Console -> Project Settings -> Service Accounts"
    echo "Haz clic en 'Generate new private key' y descarga el JSON"
    echo

    firebase_configured=false
    while [[ "$firebase_configured" != "true" ]]; do
        read -p "Ruta al archivo JSON de Firebase Service Account: " firebase_json_path

        if [[ -f "$firebase_json_path" ]]; then
            # Read and escape the JSON content
            firebase_json_content=$(cat "$firebase_json_path" | jq -c . | sed 's/"/\\"/g')

            if ! grep -q "^FIREBASE_SERVICE_ACCOUNT=" "$ENV_FILE"; then
                echo "FIREBASE_SERVICE_ACCOUNT=\"$firebase_json_content\"" >> "$ENV_FILE"
            else
                sed -i.bak "s/^FIREBASE_SERVICE_ACCOUNT=.*/FIREBASE_SERVICE_ACCOUNT=\"$firebase_json_content\"/" "$ENV_FILE"
            fi

            # Extract project ID from JSON
            project_id=$(cat "$firebase_json_path" | jq -r '.project_id')
            if ! grep -q "^FIREBASE_PROJECT_ID=" "$ENV_FILE"; then
                echo "FIREBASE_PROJECT_ID=$project_id" >> "$ENV_FILE"
            else
                sed -i.bak "s/^FIREBASE_PROJECT_ID=.*/FIREBASE_PROJECT_ID=$project_id/" "$ENV_FILE"
            fi

            log_success "Firebase configurado correctamente"
            firebase_configured=true
        else
            log_error "Archivo no encontrado: $firebase_json_path"
            read -p "¿Quieres intentar de nuevo? (y/n) [y]: " retry
            retry=${retry:-y}
            if [[ "$retry" != "y" ]]; then
                log_warning "Firebase no configurado. El sistema usará Expo como fallback."
                break
            fi
        fi
    done
}

configure_twilio_settings() {
    echo
    log_info "Configuración de Twilio (requerido para SMS):"
    echo "Ve a: https://www.twilio.com/console"
    echo

    # Check if already configured
    if grep -q "^TWILIO_ACCOUNT_SID=" "$ENV_FILE" && grep -q "^TWILIO_AUTH_TOKEN=" "$ENV_FILE"; then
        read -p "Twilio ya está configurado. ¿Quieres reconfigurarlo? (y/n) [n]: " reconfigure
        if [[ "$reconfigure" != "y" ]]; then
            log_info "Configuración de Twilio omitida"
            return
        fi
    fi

    read -p "TWILIO_ACCOUNT_SID: " twilio_account_sid
    read -p "TWILIO_AUTH_TOKEN: " twilio_auth_token
    read -p "TWILIO_PHONE_NUMBER (+1234567890): " twilio_phone_number

    if [[ -n "$twilio_account_sid" ]] && [[ -n "$twilio_auth_token" ]] && [[ -n "$twilio_phone_number" ]]; then
        if ! grep -q "^TWILIO_ACCOUNT_SID=" "$ENV_FILE"; then
            echo "TWILIO_ACCOUNT_SID=$twilio_account_sid" >> "$ENV_FILE"
            echo "TWILIO_AUTH_TOKEN=$twilio_auth_token" >> "$ENV_FILE"
            echo "TWILIO_PHONE_NUMBER=$twilio_phone_number" >> "$ENV_FILE"
        else
            sed -i.bak "s/^TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID=$twilio_account_sid/" "$ENV_FILE"
            sed -i.bak "s/^TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=$twilio_auth_token/" "$ENV_FILE"
            sed -i.bak "s/^TWILIO_PHONE_NUMBER=.*/TWILIO_PHONE_NUMBER=$twilio_phone_number/" "$ENV_FILE"
        fi
        log_success "Twilio configurado correctamente"
    else
        log_warning "Twilio no configurado completamente. Las notificaciones push funcionarán, pero no el SMS fallback."
    fi
}

configure_base_settings() {
    echo
    log_info "Configuración básica del sistema..."

    # Database URL
    if ! grep -q "^DATABASE_URL=" "$ENV_FILE"; then
        read -p "DATABASE_URL (PostgreSQL): " database_url
        if [[ -n "$database_url" ]]; then
            echo "DATABASE_URL=\"$database_url\"" >> "$ENV_FILE"
        fi
    fi

    # JWT Secret
    if ! grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        jwt_secret=$(openssl rand -hex 32)
        echo "JWT_SECRET=$jwt_secret" >> "$ENV_FILE"
        log_info "JWT_SECRET generado automáticamente"
    fi

    # Redis (optional)
    if ! grep -q "^REDIS_URL=" "$ENV_FILE"; then
        read -p "REDIS_URL (opcional, presiona Enter para omitir): " redis_url
        if [[ -n "$redis_url" ]]; then
            echo "REDIS_URL=$redis_url" >> "$ENV_FILE"
        fi
    fi

    # Environment
    if ! grep -q "^NODE_ENV=" "$ENV_FILE"; then
        echo "NODE_ENV=development" >> "$ENV_FILE"
    fi

    # Rate limiting defaults
    if ! grep -q "^NOTIFICATION_RATE_LIMIT_PER_HOUR=" "$ENV_FILE"; then
        echo "NOTIFICATION_RATE_LIMIT_PER_HOUR=100" >> "$ENV_FILE"
        echo "NOTIFICATION_RATE_LIMIT_PER_MINUTE=10" >> "$ENV_FILE"
    fi
}

# Test the configuration
test_configuration() {
    log_info "Probando configuración..."

    # Build the project to check for compilation errors
    log_info "Compilando proyecto..."
    if npm run build > /dev/null 2>&1; then
        log_success "Proyecto compilado exitosamente"
    else
        log_error "Errores de compilación. Revisa la configuración."
        return 1
    fi

    # Check if we can start the application
    log_info "Verificando que la aplicación pueda iniciarse..."

    # Start the app in background for a quick health check
    timeout 10s npm run start:prod > /dev/null 2>&1 &
    app_pid=$!

    sleep 3

    # Test health endpoint
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        log_success "API responde correctamente"
    else
        log_warning "API no responde. Puede que necesites configurar la base de datos primero."
        log_info "Ejecuta: npx prisma migrate dev"
    fi

    # Kill the test app
    kill $app_pid 2>/dev/null || true

    # Test notification status endpoint if API is running
    if curl -f -s http://localhost:3000/api/notifications/provider-status > /dev/null 2>&1; then
        log_success "Sistema de notificaciones operativo"
    else
        log_warning "Endpoint de notificaciones no disponible"
    fi
}

# Display summary
display_summary() {
    echo
    log_success "🎉 ¡Configuración completada!"
    echo
    echo "📋 Resumen de la configuración:"
    echo

    # Show provider
    provider=$(grep "^NOTIFICATION_PROVIDER=" "$ENV_FILE" | cut -d'=' -f2)
    echo "🔔 Proveedor de notificaciones: $provider"

    # Show configured services
    if grep -q "^EXPO_PROJECT_ID=" "$ENV_FILE" 2>/dev/null; then
        echo "📱 Expo Notifications: ✅ Configurado"
    fi

    if grep -q "^FIREBASE_PROJECT_ID=" "$ENV_FILE" 2>/dev/null; then
        echo "🔥 Firebase: ✅ Configurado"
    fi

    if grep -q "^TWILIO_ACCOUNT_SID=" "$ENV_FILE" 2>/dev/null; then
        echo "📞 Twilio SMS: ✅ Configurado"
    else
        echo "📞 Twilio SMS: ⚠️ No configurado (solo push notifications)"
    fi

    echo
    log_info "📚 Próximos pasos:"
    echo "1. Configura tu base de datos: npx prisma migrate dev"
    echo "2. Inicia el servidor: npm run start:dev"
    echo "3. Verifica el estado: curl http://localhost:3000/api/notifications/provider-status"
    echo "4. Lee la documentación: docs/expo-notifications-setup.md"
    echo
    log_info "📖 Para más información sobre configuración avanzada:"
    echo "   - docs/notification-config.md"
    echo "   - docs/expo-notifications-production-deployment.md"
}

# Main execution
main() {
    echo
    log_info "🚀 Configurando Sistema Dual de Notificaciones para Uber Clone"
    echo "====================================================================="
    echo

    check_project_root
    backup_env_file
    check_dependencies
    install_dependencies
    configure_environment

    echo
    if test_configuration; then
        display_summary
    else
        log_error "Hubo problemas durante la configuración. Revisa los logs anteriores."
        exit 1
    fi
}

# Run main function
main "$@"



