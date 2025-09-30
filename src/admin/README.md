# Admin Module

Módulo de administración completo para la plataforma de rides, con sistema RBAC (Role-Based Access Control) y funcionalidades avanzadas de gestión.

## 📋 Características

- **Autenticación separada**: Sistema JWT específico para administradores
- **Control de acceso granular**: 4 roles con 60+ permisos específicos
- **Auditoría completa**: Registro de todas las acciones administrativas
- **Dashboard en tiempo real**: Métricas y alertas del sistema
- **Gestión integral**: Usuarios, conductores, viajes, reportes

## 🏗️ Arquitectura

```
src/admin/
├── controllers/     # Endpoints REST
├── services/       # Lógica de negocio
├── dto/           # Objetos de transferencia
├── guards/        # Guards de autorización
├── decorators/    # Decorators personalizados
├── interfaces/    # Interfaces TypeScript
├── strategies/    # Estrategias de autenticación
└── modules/       # Módulos específicos
```

## 🔐 Roles y Permisos

### Roles Disponibles
- **Super Admin**: Control total del sistema
- **Admin**: Gestión diaria de operaciones
- **Moderator**: Monitoreo y soporte limitado
- **Support**: Atención al cliente

### Categorías de Permisos
- `users:*` - Gestión de usuarios
- `drivers:*` - Gestión de conductores
- `rides:*` - Gestión de viajes
- `analytics:*` - Reportes y métricas
- `system:*` - Configuración del sistema

## 🚀 Uso

```typescript
// Importar el módulo
import { AdminModule } from './admin/admin.module';

// Usar en app.module.ts
@Module({
  imports: [AdminModule],
})
export class AppModule {}
```

## 📊 Endpoints Principales

- `POST /admin/auth/login` - Login de administradores
- `GET /admin/dashboard` - Dashboard con métricas
- `GET /admin/rides` - Lista de viajes con filtros
- `GET /admin/users` - Gestión de usuarios
- `GET /admin/drivers` - Gestión de conductores
- `GET /admin/reports` - Reportes y analytics