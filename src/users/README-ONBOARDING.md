# 🚀 Onboarding Flow - Guía Completa

## 📋 Resumen

El sistema de onboarding permite a los usuarios completar su perfil paso a paso después del registro inicial. Incluye configuración de ubicación, información personal, preferencias y verificación.

## 🎯 Flujo de Onboarding

### Paso 1: Registro Básico ✅
```bash
POST /api/auth/register
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!"
}
```

### Paso 2: Verificar Estado del Onboarding 🔍
```bash
GET /api/onboarding/status
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "isCompleted": false,
  "completedSteps": [],
  "nextStep": "location",
  "progress": 0
}
```

### Paso 3: Configurar Ubicación 📍
```bash
POST /api/onboarding/location
Authorization: Bearer <jwt-token>
{
  "country": "Venezuela",
  "state": "Miranda",
  "city": "Caracas",
  "postalCode": "1010"
}
```

### Paso 4: Información Personal 👤
```bash
POST /api/onboarding/personal
Authorization: Bearer <jwt-token>
{
  "phone": "+584141234567",
  "dateOfBirth": "1990-05-15",
  "gender": "male"
}
```

### Paso 5: Preferencias ⚙️
```bash
POST /api/onboarding/preferences
Authorization: Bearer <jwt-token>
{
  "preferredLanguage": "es",
  "timezone": "America/Caracas",
  "currency": "USD"
}
```

### Paso 6: Verificación 📱
```bash
# Enviar código de verificación
POST /api/onboarding/verify-phone
Authorization: Bearer <jwt-token>

# Verificar código
POST /api/onboarding/verify-code
Authorization: Bearer <jwt-token>
{
  "phoneVerificationCode": "123456"
}
```

### Paso 7: Completar Onboarding 🎉
```bash
POST /api/onboarding/complete
Authorization: Bearer <jwt-token>
{
  "address": "Calle 123, Centro",
  "profileImage": "https://example.com/profile.jpg"
}
```

## 📊 Estados del Onboarding

### Estados de Progreso
- **0%**: Sin completar ningún paso
- **25%**: Ubicación completada
- **50%**: Información personal completada
- **75%**: Preferencias completadas
- **100%**: Onboarding completado

### Pasos Requeridos
1. **location** - País, estado, ciudad
2. **personal** - Teléfono, fecha nacimiento, género
3. **preferences** - Idioma, zona horaria, moneda
4. **verification** - Verificación de teléfono/email (opcional)

## 🔧 Endpoints Disponibles

### GET `/api/onboarding/status`
**Verificar estado del onboarding**
- **Auth**: JWT requerido
- **Respuesta**: Estado actual del progreso

### POST `/api/onboarding/location`
**Configurar ubicación**
- **Auth**: JWT requerido
- **Body**: `OnboardingLocationDto`

### POST `/api/onboarding/personal`
**Configurar información personal**
- **Auth**: JWT requerido
- **Body**: `OnboardingPersonalDto`

### POST `/api/onboarding/preferences`
**Configurar preferencias**
- **Auth**: JWT requerido
- **Body**: `OnboardingPreferencesDto`

### POST `/api/onboarding/verify-phone`
**Enviar código de verificación SMS**
- **Auth**: JWT requerido
- **Nota**: Actualmente simulado para desarrollo

### POST `/api/onboarding/verify-email`
**Enviar código de verificación Email**
- **Auth**: JWT requerido
- **Nota**: Actualmente simulado para desarrollo

### POST `/api/onboarding/verify-code`
**Verificar código recibido**
- **Auth**: JWT requerido
- **Body**: `OnboardingVerificationDto`

### POST `/api/onboarding/complete`
**Marcar onboarding como completado**
- **Auth**: JWT requerido
- **Body**: `CompleteOnboardingDto`

## 📱 Integración con Frontend

### Ejemplo de Flujo en React/Vue

```javascript
// Paso 1: Verificar estado
const checkOnboardingStatus = async () => {
  const response = await fetch('/api/onboarding/status', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const status = await response.json();

  if (!status.isCompleted) {
    // Redirigir al siguiente paso
    redirectToStep(status.nextStep);
  }
};

// Paso 2: Completar ubicación
const completeLocation = async (locationData) => {
  const response = await fetch('/api/onboarding/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(locationData)
  });

  if (response.ok) {
    // Continuar al siguiente paso
    checkOnboardingStatus();
  }
};
```

### Estados de UI Recomendados

```javascript
const onboardingSteps = [
  { id: 'location', title: 'Ubicación', icon: '📍', required: true },
  { id: 'personal', title: 'Información Personal', icon: '👤', required: true },
  { id: 'preferences', title: 'Preferencias', icon: '⚙️', required: true },
  { id: 'verification', title: 'Verificación', icon: '📱', required: false }
];
```

## 🔐 Seguridad y Validación

### Validaciones Implementadas
- **Ubicación**: País, estado y ciudad requeridos
- **Personal**: Teléfono, fecha nacimiento y género requeridos
- **Preferencias**: Idioma, zona horaria y moneda requeridos
- **Verificación**: Códigos de 6 dígitos para teléfono/email

### Autenticación
- Todos los endpoints requieren JWT válido
- Usuario solo puede modificar su propio perfil
- Validación de permisos en cada endpoint

## 🧪 Testing del Onboarding

### Test Manual con cURL

```bash
# 1. Verificar estado
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/onboarding/status

# 2. Configurar ubicación
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"country":"Venezuela","state":"Miranda","city":"Caracas"}' \
     http://localhost:3000/api/onboarding/location
```

### Tests Automatizados

```typescript
describe('OnboardingController', () => {
  it('should return onboarding status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/onboarding/status')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('isCompleted');
    expect(response.body).toHaveProperty('completedSteps');
  });
});
```

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
1. **Integración SMS real** (Twilio, AWS SNS)
2. **Integración Email real** (SendGrid, AWS SES)
3. **Verificación de identidad** (documentos, biometría)
4. **Geolocalización automática**
5. **Validación de direcciones**
6. **Sincronización con servicios externos**

### Mejoras de UX
1. **Progreso visual** en la UI
2. **Skip steps** para usuarios avanzados
3. **Auto-guardado** de progreso
4. **Validación en tiempo real**
5. **Mensajes de ayuda contextuales**

## 📚 Referencias

- [API Endpoints](../docs/API-ENDPOINTS-GUIDE.md)
- [Database Schema](../docs/schema.md)
- [Authentication Guide](../docs/AUTHENTICATION-GUIDE.md)

---

¡El sistema de onboarding está listo para usar! 🚀
