# 🔑 Guía para Obtener API Keys de Clerk

Esta guía te explica paso a paso cómo obtener y configurar las claves API necesarias para integrar Clerk en tu proyecto Uber Clone.

## 📋 API Keys Requeridas

Necesitas configurar las siguientes variables de entorno para Clerk:

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

## 🚀 Paso 1: Crear cuenta en Clerk

1. Ve a [https://clerk.com](https://clerk.com)
2. Haz clic en **"Sign Up"** (Registro)
3. Crea tu cuenta con email y contraseña
4. Verifica tu email

## 🏗️ Paso 2: Crear una aplicación

1. Una vez dentro del dashboard, haz clic en **"Create application"**
2. Elige un nombre para tu aplicación (ej: "Uber Clone")
3. Selecciona el tipo de aplicación:
   - **Single-page application** (SPA) si usas React/Vue/Angular
   - **Next.js** si usas Next.js
   - **Redwood** si usas Redwood
   - **API** si solo necesitas autenticación backend

## 🔑 Paso 3: Obtener las API Keys

### Secret Key y Publishable Key

1. En el dashboard de Clerk, ve a **"API Keys"** en el menú lateral
2. Copia las siguientes claves:

**Para desarrollo:**
- **Publishable Key**: `pk_test_...` (este es seguro mostrar en el frontend)
- **Secret Key**: `sk_test_...` (este debe mantenerse secreto)

**Para producción:**
- **Publishable Key**: `pk_live_...`
- **Secret Key**: `sk_live_...`

### JWT Public Key

1. En la sección **"API Keys"**, busca **"JWT Public Key"**
2. Copia la clave pública completa (incluyendo `-----BEGIN PUBLIC KEY-----` y `-----END PUBLIC KEY-----`)
3. Esta clave se usa para verificar tokens JWT en tu backend

## ⚙️ Paso 4: Configurar tu aplicación

### Configuración Básica

1. Ve a **"Settings"** > **"General"**
2. Configura:
   - **Application name**: Nombre de tu app
   - **Primary domain**: Tu dominio (ej: `uber-clone.vercel.app`)
   - **Sign-in URL**: URL donde redirigir después del login
   - **Sign-up URL**: URL donde redirigir después del registro
   - **Home URL**: URL de tu página principal

### Configuración de Autenticación

1. Ve a **"Settings"** > **"Authentication"**
2. Configura los métodos de autenticación que quieres:
   - ✅ **Email & Password**
   - ✅ **Social providers** (Google, GitHub, etc.)
   - ✅ **Phone number** (opcional)

### Configuración de Social Providers (Opcional)

Para agregar Google, GitHub, etc.:

1. Ve a **"Settings"** > **"Social providers"**
2. Habilita los proveedores que necesites
3. Para cada proveedor:
   - Crea una aplicación en el proveedor (Google Console, GitHub OAuth Apps)
   - Copia las credenciales (Client ID y Client Secret)
   - Pégalas en Clerk

## 📁 Paso 5: Configurar variables de entorno

### Crear archivo .env

Crea un archivo `.env` en la raíz de tu proyecto:

```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nYOUR_JWT_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----
CLERK_API_URL=https://api.clerk.com/v1
CLERK_FRONTEND_API=clerk.your-domain.com
CLERK_DOMAIN=your-domain.com
```

### Variables específicas por entorno

**Desarrollo:**
```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Producción:**
```env
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
NODE_ENV=production
```

## 🔐 Paso 6: Configurar seguridad

### JWT Tokens

1. Ve a **"Settings"** > **"Tokens"**
2. Configura:
   - **Access token expiration**: 1 hora (recomendado)
   - **Refresh token expiration**: 7 días (recomendado)
   - **Cookie settings**: Configura según tus necesidades

### Authorized Origins (Importante)

1. Ve a **"Settings"** > **"Authorized origins"**
2. Agrega los dominios autorizados:
   - `http://localhost:3000` (desarrollo)
   - `http://localhost:3001` (si tienes otro puerto)
   - `https://your-domain.com` (producción)
   - `https://your-domain.vercel.app` (si usas Vercel)

## 🧪 Paso 7: Probar la configuración

### Verificar API Keys

```bash
# Verificar que las variables de entorno están configuradas
echo $CLERK_SECRET_KEY
echo $CLERK_PUBLISHABLE_KEY
```

### Probar endpoints

```bash
# Probar registro con Clerk
curl -X POST http://localhost:3000/api/user/clerk/register \
  -H "Authorization: Bearer TU_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }'
```

## 🚨 Solución de Problemas

### Error: "Invalid Clerk token"

1. Verifica que el `CLERK_JWT_PUBLIC_KEY` esté configurado correctamente
2. Asegúrate de que el token JWT no haya expirado
3. Verifica que el `CLERK_SECRET_KEY` sea correcto

### Error: "Unauthorized origins"

1. Agrega tu dominio a **"Authorized origins"** en Clerk Dashboard
2. Incluye el protocolo (`http://` o `https://`)

### Error: "Application not found"

1. Verifica que estés usando las claves de la aplicación correcta
2. Asegúrate de que la aplicación esté en modo **"Live"** (no "Development")

## 📚 Recursos Adicionales

- [Documentación oficial de Clerk](https://clerk.com/docs)
- [Guía de configuración de Clerk](https://clerk.com/docs/quickstarts/setup-clerk)
- [Referencia de API de Clerk](https://clerk.com/docs/reference/backend-api)

## ⚠️ Notas de Seguridad

1. **Nunca** expongas `CLERK_SECRET_KEY` en el frontend
2. **Siempre** usa HTTPS en producción
3. **Mantén actualizadas** tus dependencias de Clerk
4. **Configura** authorized origins correctamente
5. **Monitorea** los logs de autenticación

## 🎯 Próximos pasos

Una vez configuradas las API keys:

1. ✅ **Configurar el frontend** para usar Clerk
2. ✅ **Implementar middleware** de autenticación
3. ✅ **Configurar webhooks** para sincronización de usuarios
4. ✅ **Personalizar** páginas de login/registro
5. ✅ **Configurar** roles y permisos

¿Necesitas ayuda con algún paso específico de la configuración?
