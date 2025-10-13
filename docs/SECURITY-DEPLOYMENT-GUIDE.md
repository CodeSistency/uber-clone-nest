# 🚀 **Guía de Deployment - Endpoints de Seguridad**

## 🎯 **Resumen**

Esta guía te llevará paso a paso para implementar y desplegar los nuevos endpoints de verificación de seguridad en tu proyecto Uber Clone.

---

## 📋 **Prerrequisitos**

### **Software Requerido**
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm o yarn

### **Servicios Externos**
- Cuenta de Twilio (SMS)
- Cuenta de Firebase (Notificaciones)
- Servicio de almacenamiento (para fotos de DNI)

---

## 🔧 **Paso 1: Preparación del Entorno**

### **1.1 Clonar y Preparar el Proyecto**
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd uber-clone-nest

# Instalar dependencias
npm install

# Verificar que el proyecto compile
npm run build
```

### **1.2 Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar variables de entorno
nano .env
```

**Variables requeridas:**
```bash
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/uber_clone

# JWT
JWT_SECRET=tu-secreto-jwt-super-seguro
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu-auth-token-de-twilio
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Notificaciones)
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-clave-privada\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com

# Servidor
PORT=3000
NODE_ENV=development
```

---

## 🗄️ **Paso 2: Configuración de Base de Datos**

### **2.1 Ejecutar Migraciones**
```bash
# Generar migración de Prisma
npx prisma migrate dev --name add_security_verification_tables

# Generar cliente de Prisma
npx prisma generate

# Verificar estado de la base de datos
npx prisma db status
```

### **2.2 Verificar Tablas Creadas**
```sql
-- Conectar a PostgreSQL
psql -U usuario -d uber_clone

-- Verificar tablas
\dt verification_codes
\dt identity_verifications

-- Verificar campos agregados a users
\d users
```

**Tablas esperadas:**
- `verification_codes` - Códigos de verificación
- `identity_verifications` - Solicitudes de verificación de identidad
- Campos agregados a `users`: `dni_number`, `identity_verified_at`

---

## 🔐 **Paso 3: Configuración de Servicios Externos**

### **3.1 Configurar Twilio (SMS)**

1. **Crear cuenta en Twilio**
   - Ir a [twilio.com](https://www.twilio.com)
   - Crear cuenta gratuita
   - Obtener Account SID y Auth Token

2. **Configurar número de teléfono**
   - Comprar número de teléfono
   - Configurar webhooks si es necesario

3. **Verificar configuración**
   ```bash
   # Probar conexión con Twilio
   node -e "
   const twilio = require('twilio');
   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
   console.log('Twilio configurado correctamente');
   "
   ```

### **3.2 Configurar Firebase (Notificaciones)**

1. **Crear proyecto en Firebase**
   - Ir a [console.firebase.google.com](https://console.firebase.google.com)
   - Crear nuevo proyecto
   - Habilitar Cloud Messaging

2. **Generar clave de servicio**
   - Ir a Project Settings > Service Accounts
   - Generar nueva clave privada
   - Descargar archivo JSON

3. **Configurar variables de entorno**
   ```bash
   # Extraer valores del archivo JSON descargado
   FIREBASE_PROJECT_ID=tu-proyecto-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
   ```

### **3.3 Configurar Almacenamiento (Fotos de DNI)**

**Opción 1: AWS S3**
```bash
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu-bucket-dni-photos
```

**Opción 2: Google Cloud Storage**
```bash
GOOGLE_CLOUD_PROJECT_ID=tu-proyecto
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
GOOGLE_CLOUD_BUCKET=tu-bucket-dni-photos
```

**Opción 3: Almacenamiento Local (Desarrollo)**
```bash
UPLOAD_PATH=./uploads/dni-photos
```

---

## 🚀 **Paso 4: Deployment**

### **4.1 Desarrollo Local**
```bash
# Iniciar servidor de desarrollo
npm run start:dev

# En otra terminal, probar endpoints
node test-security-endpoints.js
```

### **4.2 Producción**

#### **4.2.1 Build del Proyecto**
```bash
# Compilar TypeScript
npm run build

# Verificar que se generó la carpeta dist
ls -la dist/
```

#### **4.2.2 Configurar PM2 (Recomendado)**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Crear archivo de configuración
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'uber-clone-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js

# Verificar estado
pm2 status
pm2 logs uber-clone-api
```

#### **4.2.3 Configurar Nginx (Opcional)**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 **Paso 5: Testing y Validación**

### **5.1 Ejecutar Tests Automatizados**
```bash
# Ejecutar script de pruebas
node test-security-endpoints.js

# Ejecutar tests unitarios
npm run test

# Ejecutar tests de integración
npm run test:e2e
```

### **5.2 Verificar Endpoints Manualmente**

#### **5.2.1 Cambio de Email**
```bash
# 1. Solicitar cambio
curl -X POST http://localhost:3000/api/user/change-email/request \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"newEmail":"test@example.com","password":"MiContraseña123!"}'

# 2. Verificar cambio (usar código del email)
curl -X POST http://localhost:3000/api/user/change-email/verify \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"newEmail":"test@example.com","code":"123456"}'
```

#### **5.2.2 Cambio de Teléfono**
```bash
# 1. Solicitar cambio
curl -X POST http://localhost:3000/api/user/change-phone/request \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"newPhone":"+584121234567"}'

# 2. Verificar cambio (usar código del SMS)
curl -X POST http://localhost:3000/api/user/change-phone/verify \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"newPhone":"+584121234567","code":"123456"}'
```

#### **5.2.3 Verificación de Identidad**
```bash
# 1. Enviar verificación
curl -X POST http://localhost:3000/api/user/identity-verification/submit \
  -H "Authorization: Bearer tu-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"dniNumber":"12345678","frontPhotoUrl":"https://example.com/front.jpg","backPhotoUrl":"https://example.com/back.jpg"}'

# 2. Verificar estado
curl -X GET http://localhost:3000/api/user/identity-verification/status \
  -H "Authorization: Bearer tu-jwt-token"
```

---

## 📊 **Paso 6: Monitoreo y Logs**

### **6.1 Configurar Logs**
```bash
# Crear directorio de logs
mkdir -p logs

# Configurar rotación de logs
npm install -g logrotate

# Crear configuración de logrotate
cat > /etc/logrotate.d/uber-clone << EOF
/path/to/uber-clone/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
```

### **6.2 Monitoreo de Salud**
```bash
# Crear endpoint de salud
curl -X GET http://localhost:3000/health

# Verificar métricas
curl -X GET http://localhost:3000/metrics
```

### **6.3 Alertas Importantes**
- **Rate limiting activado**: Usuario excede límites
- **Códigos de verificación fallidos**: Múltiples intentos fallidos
- **Verificaciones de identidad pendientes**: Acumulación de solicitudes
- **Errores de servicios externos**: Twilio, Firebase, etc.

---

## 🔒 **Paso 7: Seguridad y Hardening**

### **7.1 Configuración de Seguridad**
```bash
# Configurar firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Configurar SSL/TLS
certbot --nginx -d tu-dominio.com
```

### **7.2 Variables de Entorno Seguras**
```bash
# Usar archivo .env.production
cp .env .env.production

# Configurar permisos
chmod 600 .env.production
chown app:app .env.production
```

### **7.3 Backup de Base de Datos**
```bash
# Crear script de backup
cat > backup-db.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump uber_clone > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://tu-bucket/backups/
EOF

chmod +x backup-db.sh

# Programar backup diario
crontab -e
# Agregar: 0 2 * * * /path/to/backup-db.sh
```

---

## 🚨 **Paso 8: Troubleshooting**

### **8.1 Problemas Comunes**

#### **Error: "Database connection failed"**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Verificar conexión
psql -U usuario -d uber_clone -c "SELECT 1;"
```

#### **Error: "Twilio service not available"**
```bash
# Verificar variables de entorno
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Probar conexión
node -e "const twilio = require('twilio'); console.log('Twilio OK');"
```

#### **Error: "Firebase not initialized"**
```bash
# Verificar variables de Firebase
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Verificar archivo de clave
ls -la firebase-service-account.json
```

### **8.2 Logs de Debug**
```bash
# Ver logs de la aplicación
pm2 logs uber-clone-api

# Ver logs de Nginx
tail -f /var/log/nginx/error.log

# Ver logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-13-main.log
```

### **8.3 Comandos de Diagnóstico**
```bash
# Verificar estado de servicios
systemctl status postgresql redis nginx

# Verificar puertos
netstat -tlnp | grep :3000
netstat -tlnp | grep :5432
netstat -tlnp | grep :6379

# Verificar memoria y CPU
htop
free -h
df -h
```

---

## 📈 **Paso 9: Optimización y Escalabilidad**

### **9.1 Optimización de Base de Datos**
```sql
-- Crear índices para mejor performance
CREATE INDEX idx_verification_codes_user_type ON verification_codes(user_id, type);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
CREATE INDEX idx_identity_verifications_status ON identity_verifications(status);
CREATE INDEX idx_identity_verifications_dni ON identity_verifications(dni_number);
```

### **9.2 Configuración de Redis**
```bash
# Configurar Redis para mejor performance
echo "maxmemory 256mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
systemctl restart redis
```

### **9.3 Escalabilidad Horizontal**
```bash
# Configurar load balancer con Nginx
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

---

## ✅ **Paso 10: Checklist de Deployment**

### **Pre-deployment**
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Servicios externos configurados
- [ ] Tests pasando
- [ ] Logs configurados

### **Deployment**
- [ ] Aplicación compilada
- [ ] Servicios iniciados
- [ ] Nginx configurado
- [ ] SSL/TLS configurado
- [ ] Monitoreo activo

### **Post-deployment**
- [ ] Endpoints funcionando
- [ ] Emails enviándose
- [ ] SMS enviándose
- [ ] Verificaciones de identidad funcionando
- [ ] Logs siendo generados
- [ ] Backup configurado

---

## 🆘 **Soporte y Contacto**

### **Recursos de Ayuda**
- [Documentación de la API](http://localhost:3000/api)
- [Logs de la aplicación](./logs/)
- [Scripts de testing](./test-security-endpoints.js)
- [Guía de troubleshooting](./TROUBLESHOOTING.md)

### **Contacto**
- **Email**: dev@uber-clone.com
- **Slack**: #uber-clone-support
- **GitHub**: [Issues](https://github.com/tu-repo/issues)

---

**Última actualización:** 2024-01-15  
**Versión:** 1.0.0  
**Autor:** Equipo de Desarrollo Uber Clone
