# 🚀 Módulo de Administración - Guía de Uso

## 📋 **Resumen**

El módulo de administración proporciona un sistema completo RBAC (Role-Based Access Control) para gestionar todos los aspectos de la plataforma Uber Clone.

## 🔐 **Credenciales de Administradores**

| Email | Contraseña | Rol | Permisos |
|-------|------------|-----|----------|
| `superadmin@uberclone.com` | `SuperAdmin123!` | Super Admin | Todos los permisos |
| `admin@uberclone.com` | `Admin123!` | Admin | Gestión completa |
| `moderator@uberclone.com` | `Moderator123!` | Moderator | Solo lectura |
| `support@uberclone.com` | `Support123!` | Support | Soporte limitado |

## 🔑 **Autenticación**

### Login de Admin
```bash
POST /admin/auth/login
Content-Type: application/json

{
  "email": "superadmin@uberclone.com",
  "password": "SuperAdmin123!"
}
```

### Usar Token en Headers
```bash
Authorization: Bearer <admin_jwt_token>
```

## 📊 **Dashboard y Métricas**

### Obtener métricas del dashboard
```bash
GET /admin/dashboard/metrics
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "totalUsers": 150,
  "activeUsers": 120,
  "newUsersToday": 5,
  "totalDrivers": 45,
  "onlineDrivers": 32,
  "activeRides": 8,
  "completedRidesToday": 127,
  "totalRevenue": 15420.50,
  "revenueToday": 2340.75
}
```

## 👥 **Gestión de Usuarios**

### Listar usuarios con filtros
```bash
GET /admin/users?page=1&limit=10&search=john&status=active&userType=user
```

### Obtener usuario específico
```bash
GET /admin/users/123
```

### Actualizar estado de usuario
```bash
PUT /admin/users/123/status
Content-Type: application/json

{
  "isActive": false
}
```

### Eliminar usuario (soft delete)
```bash
DELETE /admin/users/123
```

## 🚗 **Gestión de Drivers**

### Listar drivers con filtros
```bash
GET /admin/drivers?page=1&limit=10&search=carlos&status=online&verificationStatus=approved
```

### Obtener driver específico
```bash
GET /admin/drivers/456
```

### Actualizar estado de driver
```bash
PUT /admin/drivers/456/status
Content-Type: application/json

{
  "status": "suspended"
}
```

### Actualizar verificación de driver
```bash
PUT /admin/drivers/456/verification
Content-Type: application/json

{
  "verificationStatus": "approved",
  "notes": "Documentos verificados correctamente"
}
```

## 🚕 **Gestión de Rides**

### Listar rides con filtros
```bash
GET /admin/rides?page=1&limit=10&paymentStatus=completed&driverId=456
```

### Obtener ride específico
```bash
GET /admin/rides/789
```

## 🏪 **Gestión de Stores**

### Listar stores con filtros
```bash
GET /admin/stores?page=1&limit=10&search=pizza&category=restaurant&isOpen=true
```

### Obtener store específico
```bash
GET /admin/stores/101
```

### Actualizar estado de store
```bash
PUT /admin/stores/101/status
Content-Type: application/json

{
  "isOpen": false
}
```

## 📊 **Sistema de Reportes**

### Reporte de usuarios
```bash
GET /admin/reports/users
```

### Reporte de rides
```bash
GET /admin/reports/rides
```

### Reporte de drivers
```bash
GET /admin/reports/drivers
```

### Reporte financiero
```bash
GET /admin/reports/financial
```

## 🛡️ **Sistema de Permisos**

### Permisos disponibles:
- `user:read` - Leer usuarios
- `user:write` - Escribir usuarios
- `user:delete` - Eliminar usuarios
- `driver:read` - Leer drivers
- `driver:write` - Escribir drivers
- `driver:approve` - Aprobar drivers
- `ride:read` - Leer rides
- `ride:write` - Escribir rides
- `ride:monitor` - Monitorear rides
- `ride:intervene` - Intervenir en rides
- `store:read` - Leer stores
- `store:write` - Escribir stores
- `store:approve` - Aprobar stores
- `reports:view` - Ver reportes
- `logs:view` - Ver logs
- `system:config` - Configuración del sistema

### Roles y sus permisos:

#### **Super Admin** 👑
Todos los permisos del sistema

#### **Admin** 👨‍💼
- Gestión completa de usuarios, drivers, rides, stores
- Ver reportes y logs
- Configuración del sistema

#### **Moderator** 👮
- Solo lectura de usuarios, drivers, rides, stores
- Ver reportes

#### **Support** 🎧
- Lectura limitada de usuarios, drivers, rides
- Enviar notificaciones

## 🔧 **Arquitectura Técnica**

### Estructura del Módulo
```
src/modules/admin/
├── admin.module.ts          # Módulo principal
├── admin.controller.ts      # Endpoints principales
├── admin-auth.controller.ts # Autenticación
├── admin.service.ts         # Lógica de negocio
├── entities/                # Entidades y enums
├── dto/                     # Data Transfer Objects
├── guards/                  # Guards de seguridad
├── decorators/              # Decorators personalizados
├── interfaces/              # Interfaces TypeScript
└── strategies/              # Estrategias JWT
```

### Base de Datos
- **Modelo único**: `User` extendido con campos opcionales para admin
- **Campos admin**: `userType`, `adminRole`, `adminPermissions`, etc.
- **Auditoría**: Tabla `AdminAuditLog` para tracking de acciones
- **Separación lógica**: Un solo modelo pero funcionalidad diferenciada

## 🚀 **Próximos Pasos**

### Fase 2: Gestión Avanzada
- [ ] Búsqueda y filtros avanzados
- [ ] Bulk operations (acciones masivas)
- [ ] Exportación de datos (CSV, Excel)
- [ ] Notificaciones push a admins

### Fase 3: Monitoreo en Tiempo Real
- [ ] Dashboard con WebSockets
- [ ] Alertas automáticas
- [ ] Métricas en tiempo real
- [ ] Logs de auditoría en vivo

### Fase 4: Sistema de Reportes Avanzado
- [ ] Reportes personalizables
- [ ] Gráficos y visualizaciones
- [ ] Exportación PDF/Excel
- [ ] Reportes programados

### Fase 5: Seguridad y Compliance
- [ ] Rate limiting avanzado
- [ ] Logs de seguridad
- [ ] GDPR compliance tools
- [ ] Backup y recuperación

---

## 📞 **Soporte**

Para soporte técnico o preguntas sobre el módulo de administración, contactar al equipo de desarrollo.

**Versión:** 1.0.0
**Estado:** ✅ Funcional básico implementado
