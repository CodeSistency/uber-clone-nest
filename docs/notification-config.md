# 🚀 Notification Services Configuration Guide - Sistema Dual

## 🎭 **Expo vs Firebase: Configuración Inteligente**

Este sistema soporta **ambos proveedores de notificaciones** automáticamente. Elige el que mejor se adapte a tus necesidades:

| Característica | Firebase | Expo Notifications |
|---------------|----------|-------------------|
| **Configuración** | Compleja (JSON + setup) | Simple (1 variable) |
| **Costo** | Variable | **Gratis** |
| **Apps Expo** | ❌ Requiere eject | ✅ **Nativo perfecto** |
| **Mantenimiento** | Alto | **Cero** |
| **Performance** | Excelente | Muy buena |

## ⚙️ **Configuración del Sistema Dual**

### Variables de Entorno

```env
# =========================================
# NOTIFICATION PROVIDER SELECTION
# =========================================

# Elige tu proveedor: 'firebase' o 'expo'
NOTIFICATION_PROVIDER=expo  # Recomendado para apps Expo

# =========================================
# EXPO CONFIGURATION (Opcional)
# =========================================

# Solo si usas Expo - obténlo de expo.dev o deja vacío
EXPO_PROJECT_ID=your-expo-project-id

# =========================================
# FIREBASE CONFIGURATION (Solo si usas Firebase)
# =========================================

# Firebase Project ID (from Firebase Console)
FIREBASE_PROJECT_ID=your-firebase-project-id

# Firebase Service Account Key (as JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# =========================================
# TWILIO CONFIGURATION (Siempre requerido)
# =========================================

# Twilio Account SID (from Twilio Console Dashboard)
TWILIO_ACCOUNT_SID=your-twilio-account-sid

# Twilio Auth Token (from Twilio Console Dashboard)
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Twilio Phone Number (purchased from Twilio)
TWILIO_PHONE_NUMBER=+1234567890

# =========================================
# BASE CONFIGURATION
# =========================================

DATABASE_URL="postgresql://user:pass@localhost:5432/uber_clone"
JWT_SECRET=tu-jwt-secret-key
REDIS_URL=redis://localhost:6379
```

### Instalación Automática

```bash
# Instalar dependencias según el provider elegido
npm install expo-server-sdk twilio  # Para Expo
# npm install firebase-admin twilio  # Para Firebase (si no está instalado)
```

## 🎯 **Cómo Funciona el Sistema Dual**

### **Selección Automática de Provider**

```typescript
// El sistema elige automáticamente basado en NOTIFICATION_PROVIDER
const notificationManager = new NotificationManagerService();

// Usa Firebase
NOTIFICATION_PROVIDER=firebase
// Resultado: notificationManager usa NotificationsService (Firebase)

// Usa Expo
NOTIFICATION_PROVIDER=expo
// Resultado: notificationManager usa ExpoNotificationsService (Expo)

// Cambiar en runtime
notificationManager.switchProvider('expo'); // Cambia dinámicamente
```

### **API Consistente**

```typescript
// La misma API funciona con ambos providers
await notificationManager.sendNotification({
  userId: '123',
  type: NotificationType.RIDE_REQUEST,
  title: 'New Ride',
  message: 'Ride available',
  data: { rideId: 456 }
});

// Funciona igual con Firebase o Expo
```

## 📱 **Configuración Específica por Provider**

### **Para Apps Expo (Recomendado)**

#### 1. App Configuration (`app.json`)
```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff",
        "sounds": ["./assets/notification-sound.wav"]
      }]
    ]
  }
}
```

#### 2. Environment Variables
```env
NOTIFICATION_PROVIDER=expo
EXPO_PROJECT_ID=your-project-id  # Opcional
```

#### 3. Frontend Code
```typescript
// app/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export class NotificationService {
  async getExpoPushToken(): Promise<string | null> {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return token;
  }

  async registerPushToken(userId: string): Promise<void> {
    const token = await this.getExpoPushToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/notifications/push-token?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }
}
```

### **Para Apps con Firebase**

#### 1. Environment Variables
```env
NOTIFICATION_PROVIDER=firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={...}  # JSON completo
```

#### 2. Frontend Code (Requiere eject o configuración compleja)
```typescript
// Requiere configuración adicional de Firebase
import messaging from '@react-native-firebase/messaging';
// ... configuración compleja
```

## 🧪 **Testing del Sistema**

### Verificar Estado de Servicios

```bash
# Verificar configuración actual
curl http://localhost:3000/api/notifications/test/status
```

**Respuesta esperada:**
```json
{
  "provider": "expo",  // o "firebase"
  "expo": {
    "initialized": true,
    "status": "configured"
  },
  "firebase": {
    "initialized": false,
    "status": "not_configured"
  },
  "twilio": {
    "initialized": true,
    "status": "configured",
    "phoneNumber": "+1234567890"
  }
}
```

### Probar Notificaciones

```bash
# Notificación de prueba
curl -X POST "http://localhost:3000/api/notifications/test/ride-request?userId=test-user"

# Cambiar provider dinámicamente
curl -X POST "http://localhost:3000/api/notifications/switch-provider" \
  -H "Content-Type: application/json" \
  -d '{"provider": "firebase"}'
```

## 🔄 **Migración entre Providers**

### **De Firebase a Expo (Recomendado)**

```bash
# 1. Instalar Expo SDK
npm install expo-server-sdk

# 2. Actualizar configuración
echo "NOTIFICATION_PROVIDER=expo" >> .env

# 3. Actualizar app.json (para Expo apps)
# Agregar plugin expo-notifications

# 4. Reiniciar aplicación
npm run start:dev

# 5. Probar notificaciones
curl "http://localhost:3000/api/notifications/test/status"
```

### **De Expo a Firebase**

```bash
# 1. Instalar Firebase SDK
npm install firebase-admin

# 2. Configurar Firebase credentials
echo "NOTIFICATION_PROVIDER=firebase" >> .env
echo "FIREBASE_PROJECT_ID=..." >> .env
echo "FIREBASE_SERVICE_ACCOUNT=..." >> .env

# 3. Reiniciar aplicación
npm run start:dev
```

## 📊 **Monitoreo y Analytics**

### Métricas por Provider

```typescript
// Obtener estadísticas del sistema
const status = notificationManager.getProviderStatus();
console.log('Provider actual:', status.currentProvider);
console.log('Providers disponibles:', status.availableProviders);
```

### Logs de Notificaciones

```bash
# Ver logs por provider
grep "expo\|firebase" logs/application.log

# Ver estadísticas de entrega
curl "http://localhost:3000/api/notifications/analytics"
```

## 🚨 **Solución de Problemas**

### **Problemas con Expo**

```bash
# Verificar token de Expo
curl "http://localhost:3000/api/debug/expo-token"

# Verificar configuración
curl "http://localhost:3000/api/notifications/test/status"
```

**Errores comunes:**
- `Project ID missing`: Agregar `EXPO_PROJECT_ID` a variables de entorno
- `Token invalid`: Verificar que la app esté ejecutándose en dispositivo físico

### **Problemas con Firebase**

```bash
# Verificar configuración de Firebase
curl "http://localhost:3000/api/debug/firebase-config"

# Verificar service account
curl "http://localhost:3000/api/debug/firebase-credentials"
```

**Errores comunes:**
- `Invalid service account`: Verificar JSON de Firebase
- `Permission denied`: Revisar permisos del service account

### **Problemas Generales**

```bash
# Verificar conectividad de red
curl "http://localhost:3000/api/health"

# Verificar base de datos
curl "http://localhost:3000/api/health/database"

# Verificar tokens de usuario
curl "http://localhost:3000/api/notifications/debug/tokens?userId=user123"
```

## 🎯 **Mejores Prácticas**

### **Para Desarrollo**
- Usa `NOTIFICATION_PROVIDER=expo` para desarrollo rápido
- Configura ambos providers para testing
- Usa logs detallados para debugging

### **Para Producción**
- Elige un provider principal (Expo recomendado para apps Expo)
- Monitorea tasas de entrega
- Configura alertas para fallos
- Mantén ambos providers como backup

### **Para Escalabilidad**
- Expo maneja automáticamente el escalado
- Firebase requiere configuración adicional para alta carga
- Ambos soportan horizontal scaling

## 📞 **Soporte**

- **Expo Notifications**: [Expo Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- **Firebase Cloud Messaging**: [Firebase Docs](https://firebase.google.com/docs/cloud-messaging)
- **Twilio SMS**: [Twilio Docs](https://www.twilio.com/docs)

---

**🎉 Tu sistema de notificaciones dual está listo!**

- ✅ **Configuración automática** del provider
- ✅ **API consistente** para ambos sistemas
- ✅ **Testing completo** incluido
- ✅ **Documentación exhaustiva** disponible
- ✅ **Soporte para migración** entre providers

## Firebase Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics if desired

### 2. Enable Cloud Messaging
1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Note down your Server Key and Sender ID

### 3. Create Service Account
1. In Firebase Console, go to Project Settings
2. Click on "Service Accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the entire JSON content and paste it as the `FIREBASE_SERVICE_ACCOUNT` value

### 4. Add Mobile Apps (Optional)
1. In Firebase Console, click the Android/iOS icons to add apps
2. Follow the setup wizard
3. Download the `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)

## Twilio Setup Instructions

### 1. Create Twilio Account
1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number

### 2. Get Account Credentials
1. In Twilio Console, go to Dashboard
2. Note down your:
   - **Account SID**
   - **Auth Token**

### 3. Purchase Phone Number
1. In Twilio Console, go to "Phone Numbers"
2. Click "Buy a number"
3. Choose a number with SMS capabilities
4. Note down the purchased phone number

### 4. Configure Account Settings
1. Go to "Account" → "General settings"
2. Set up your account details
3. Configure SMS/MMS settings if needed

## Testing the Configuration

### 1. Test Firebase Connection
```bash
curl -X POST http://localhost:3000/api/notifications/test/ride-request?userId=test-user-id
```

### 2. Test Twilio Connection
```bash
curl -X POST http://localhost:3000/api/notifications/test/emergency?userId=test-user-id
```

### 3. Check Service Status
```bash
curl http://localhost:3000/api/notifications/test/status
```

## Production Considerations

### Security
- Store service account keys securely
- Use environment-specific Firebase/Twilio accounts
- Rotate keys regularly
- Implement proper access controls

### Monitoring
- Monitor notification delivery rates
- Set up alerts for failed deliveries
- Track user engagement with notifications
- Monitor API usage and costs

### Rate Limiting
```env
# Add these to your .env for production
NOTIFICATION_RATE_LIMIT_PER_HOUR=100
NOTIFICATION_RATE_LIMIT_PER_MINUTE=10
```

### Analytics
```env
# Enable analytics in production
NOTIFICATION_ANALYTICS_ENABLED=true
NOTIFICATION_ANALYTICS_RETENTION_DAYS=30
```

## Troubleshooting

### Firebase Issues
- **"Invalid service account"**: Check JSON format and project ID
- **"Permission denied"**: Verify service account has FCM permissions
- **"Token not registered"**: Token may be expired, user needs to refresh

### Twilio Issues
- **"Invalid credentials"**: Check Account SID and Auth Token
- **"Phone number not verified"**: Verify the sending number in Twilio Console
- **"Insufficient funds"**: Add credits to your Twilio account

### WebSocket Issues
- **Connection failures**: Check CORS configuration
- **Message not received**: Verify room membership
- **Performance issues**: Monitor Redis connection and memory usage

## Support

For additional help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Socket.io Documentation](https://socket.io/docs/)

---

**Note**: The notification system will work without these configurations but will only send WebSocket notifications. Firebase and Twilio are optional for push notifications and SMS fallbacks.
