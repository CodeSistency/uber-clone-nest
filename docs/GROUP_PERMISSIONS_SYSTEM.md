# 🔐 Sistema de Permisos Basado en Grupos

## 📋 Resumen

El sistema de permisos basado en grupos permite una gestión flexible y escalable de los permisos de usuario. Los usuarios pertenecen a grupos, y los grupos tienen permisos asignados, permitiendo herencia de permisos de manera eficiente.

## 🏗️ Arquitectura del Sistema

### Modelos de Datos

#### 1. Permission (Permisos Individuales)
```prisma
model Permission {
  id          Int      // ID único del permiso
  code        String   // Código único (ej: "users:read")
  name        String   // Nombre legible
  description String?  // Descripción del permiso
  module      String   // Módulo al que pertenece
  isActive    Boolean  // Si el permiso está activo
  createdAt   DateTime // Fecha de creación
  updatedAt   DateTime // Fecha de actualización
}
```

#### 2. Group (Grupos de Usuarios)
```prisma
model Group {
  id          Int      // ID único del grupo
  name        String   // Nombre único del grupo
  description String?  // Descripción del grupo
  color       String?  // Color para UI (hex)
  isSystem    Boolean  // Si es un grupo del sistema
  isActive    Boolean  // Si el grupo está activo
  priority    Int      // Prioridad (mayor gana)
  createdAt   DateTime // Fecha de creación
  updatedAt   DateTime // Fecha de actualización
}
```

#### 3. GroupPermission (Relación Grupo-Permiso)
```prisma
model GroupPermission {
  id           Int      // ID único
  groupId      Int      // ID del grupo
  permissionId Int      // ID del permiso
  grantedAt    DateTime // Fecha de asignación
  grantedBy    Int?     // Usuario que asignó el permiso
}
```

#### 4. UserGroup (Relación Usuario-Grupo)
```prisma
model UserGroup {
  id        Int       // ID único
  userId    Int       // ID del usuario
  groupId   Int       // ID del grupo
  assignedAt DateTime // Fecha de asignación
  assignedBy Int?     // Usuario que asignó el grupo
  expiresAt DateTime? // Fecha de expiración opcional
  isActive  Boolean   // Si la asignación está activa
}
```

## 📋 Permisos Definidos

### 👥 Gestión de Usuarios
- `users:read` - Ver usuarios
- `users:read:own` - Ver propio perfil
- `users:create` - Crear usuarios
- `users:update` - Actualizar usuarios
- `users:update:own` - Actualizar propio perfil
- `users:delete` - Eliminar usuarios
- `users:manage_groups` - Gestionar grupos de usuarios
- `users:view_activity` - Ver actividad de usuarios

### 🚗 Gestión de Viajes
- `rides:read` - Ver viajes
- `rides:read:own` - Ver propios viajes
- `rides:create` - Crear viajes
- `rides:update` - Actualizar viajes
- `rides:cancel` - Cancelar viajes
- `rides:manage_all` - Gestionar todos los viajes
- `rides:view_analytics` - Ver analytics de viajes

### 🛵 Gestión de Conductores
- `drivers:read` - Ver conductores
- `drivers:create` - Crear conductores
- `drivers:update` - Actualizar conductores
- `drivers:verify` - Verificar conductores
- `drivers:suspend` - Suspender conductores
- `drivers:view_documents` - Ver documentos de conductores
- `drivers:manage_vehicles` - Gestionar vehículos

### 🛒 Gestión de Delivery
- `deliveries:read` - Ver entregas
- `deliveries:create` - Crear entregas
- `deliveries:update` - Actualizar entregas
- `deliveries:cancel` - Cancelar entregas
- `deliveries:manage_all` - Gestionar todas las entregas
- `deliveries:view_analytics` - Ver analytics de entregas

### 🏪 Gestión de Comercios
- `stores:read` - Ver comercios
- `stores:create` - Crear comercios
- `stores:update` - Actualizar comercios
- `stores:approve` - Aprobar comercios
- `stores:suspend` - Suspender comercios
- `stores:manage_products` - Gestionar productos

### 💰 Gestión Financiera
- `finance:read` - Ver datos financieros
- `finance:read:own` - Ver propios datos financieros
- `finance:manage_wallet` - Gestionar wallets
- `finance:process_payments` - Procesar pagos
- `finance:view_transactions` - Ver transacciones
- `finance:manage_promotions` - Gestionar promociones

### 📊 Analytics y Reportes
- `analytics:read` - Ver analytics generales
- `analytics:users` - Analytics de usuarios
- `analytics:rides` - Analytics de viajes
- `analytics:deliveries` - Analytics de entregas
- `analytics:finance` - Analytics financieros
- `analytics:export` - Exportar reportes

### 🔔 Gestión de Notificaciones
- `notifications:read` - Ver notificaciones
- `notifications:send` - Enviar notificaciones
- `notifications:manage_templates` - Gestionar plantillas
- `notifications:view_logs` - Ver logs de notificaciones

### ⚙️ Gestión del Sistema
- `system:read_logs` - Ver logs del sistema
- `system:manage_config` - Gestionar configuración
- `system:manage_permissions` - Gestionar permisos
- `system:manage_groups` - Gestionar grupos
- `system:backup` - Realizar backups
- `system:maintenance` - Modo mantenimiento

### 🛡️ Moderación
- `moderation:read_reports` - Ver reportes
- `moderation:manage_ratings` - Gestionar calificaciones
- `moderation:manage_content` - Moderar contenido
- `moderation:ban_users` - Banear usuarios
- `moderation:view_audit` - Ver logs de auditoría

## 👥 Grupos Predefinidos

### 1. Super Admin (Prioridad: 100)
**Descripción**: Control total del sistema
**Permisos**: Todos los permisos disponibles
**Color**: #FF0000 (Rojo)

### 2. Admin General (Prioridad: 90)
**Descripción**: Administración general del sistema
**Permisos**:
- Gestión completa de usuarios, conductores, viajes, entregas
- Gestión financiera completa
- Analytics completos
- Gestión de notificaciones
- Moderación básica
**Color**: #DC143C (Carmesí)

### 3. Gerente de Operaciones (Prioridad: 80)
**Descripción**: Gestión de operaciones diarias
**Permisos**:
- Gestión de viajes y entregas
- Gestión de conductores y comercios
- Analytics operativos
- Moderación de contenido
**Color**: #4169E1 (Azul real)

### 4. Gerente Financiero (Prioridad: 75)
**Descripción**: Gestión financiera y pagos
**Permisos**:
- Gestión financiera completa
- Analytics financieros
- Gestión de promociones
- Ver transacciones
**Color**: #228B22 (Verde bosque)

### 5. Moderador de Contenido (Prioridad: 70)
**Descripción**: Moderación de contenido y usuarios
**Permisos**:
- Moderación completa
- Gestión básica de usuarios
- Ver reportes y analytics
**Color**: #FF8C00 (Naranja oscuro)

### 6. Soporte al Cliente (Prioridad: 60)
**Descripción**: Atención a usuarios y conductores
**Permisos**:
- Ver usuarios y conductores
- Gestionar tickets de soporte
- Enviar notificaciones
- Ver analytics básicos
**Color**: #9370DB (Púrpura medio)

### 7. Analista de Datos (Prioridad: 50)
**Descripción**: Acceso a reportes y analytics
**Permisos**:
- Ver todos los analytics
- Exportar reportes
- Ver datos (solo lectura)
**Color**: #20B2AA (Turquesa)

### 8. Usuario Estándar (Prioridad: 0)
**Descripción**: Usuario regular sin permisos administrativos
**Permisos**: Solo permisos propios (own)
**Color**: #808080 (Gris)

## 🔧 Uso del Sistema

### Crear un Grupo
```typescript
const group = await prisma.group.create({
  data: {
    name: 'Nuevo Grupo',
    description: 'Descripción del grupo',
    color: '#007bff',
    isSystem: false,
    priority: 10
  }
});
```

### Asignar Permisos a un Grupo
```typescript
// Obtener IDs de permisos
const permissions = await prisma.permission.findMany({
  where: { code: { in: ['users:read', 'rides:create'] } }
});

// Asignar permisos al grupo
await prisma.groupPermission.createMany({
  data: permissions.map(p => ({
    groupId: group.id,
    permissionId: p.id,
    grantedBy: currentUserId
  }))
});
```

### Asignar Usuario a Grupos
```typescript
await prisma.userGroup.create({
  data: {
    userId: userId,
    groupId: groupId,
    assignedBy: currentUserId,
    expiresAt: null // Sin expiración
  }
});
```

### Verificar Permisos de un Usuario
```typescript
async function hasPermission(userId: number, permissionCode: string): Promise<boolean> {
  const userGroups = await prisma.userGroup.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { OR: [{ equals: null }, { gt: new Date() }] }
    },
    include: {
      group: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    },
    orderBy: { group: { priority: 'desc' } } // Grupos de mayor prioridad primero
  });

  // Verificar si algún grupo tiene el permiso
  for (const userGroup of userGroups) {
    const hasPermission = userGroup.group.permissions.some(
      gp => gp.permission.code === permissionCode && gp.permission.isActive
    );
    if (hasPermission) return true;
  }

  return false;
}
```

### Obtener Todos los Permisos de un Usuario
```typescript
async function getUserPermissions(userId: number): Promise<string[]> {
  const userGroups = await prisma.userGroup.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { OR: [{ equals: null }, { gt: new Date() }] }
    },
    include: {
      group: {
        include: {
          permissions: {
            include: { permission: true },
            where: { permission: { isActive: true } }
          }
        }
      }
    }
  });

  const permissions = new Set<string>();

  for (const userGroup of userGroups) {
    for (const groupPermission of userGroup.group.permissions) {
      permissions.add(groupPermission.permission.code);
    }
  }

  return Array.from(permissions);
}
```

## 🔄 Migración y Seeds

### Crear Migración
```bash
npx prisma migrate dev --name add_group_permissions_system
```

### Archivo de Seeds
```typescript
// prisma/seed-permissions.ts
async function seedPermissions() {
  // Crear permisos
  const permissions = [
    // Usuarios
    { code: 'users:read', name: 'Ver Usuarios', module: 'users' },
    { code: 'users:create', name: 'Crear Usuarios', module: 'users' },
    // ... más permisos

    // Grupos predefinidos
    { code: 'groups:read', name: 'Ver Grupos', module: 'system' },
    { code: 'groups:create', name: 'Crear Grupos', module: 'system' },
    { code: 'groups:update', name: 'Actualizar Grupos', module: 'system' },
    { code: 'groups:delete', name: 'Eliminar Grupos', module: 'system' },

    // Permisos
    { code: 'permissions:read', name: 'Ver Permisos', module: 'system' },
    { code: 'permissions:manage', name: 'Gestionar Permisos', module: 'system' }
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission
    });
  }

  // Crear grupos predefinidos
  const groups = [
    {
      name: 'Super Admin',
      description: 'Control total del sistema',
      color: '#FF0000',
      isSystem: true,
      priority: 100
    },
    {
      name: 'Admin General',
      description: 'Administración general del sistema',
      color: '#DC143C',
      isSystem: true,
      priority: 90
    },
    // ... más grupos
  ];

  for (const group of groups) {
    const createdGroup = await prisma.group.upsert({
      where: { name: group.name },
      update: {},
      create: group
    });

    // Asignar todos los permisos al Super Admin
    if (group.name === 'Super Admin') {
      const allPermissions = await prisma.permission.findMany();
      await prisma.groupPermission.createMany({
        data: allPermissions.map(p => ({
          groupId: createdGroup.id,
          permissionId: p.id
        }))
      });
    }
  }
}
```

## 🛡️ Mejores Prácticas

### 1. Principio de Menor Privilegio
- Asignar solo los permisos necesarios para cada rol
- Usar permisos granulares en lugar de permisos amplios

### 2. Grupos del Sistema
- Marcar grupos críticos como `isSystem: true`
- No permitir eliminación de grupos del sistema

### 3. Auditoría
- Registrar todas las asignaciones de permisos y grupos
- Mantener logs de cambios en el sistema de permisos

### 4. Herencia de Permisos
- Los permisos se heredan de todos los grupos del usuario
- La prioridad de grupos resuelve conflictos

### 5. Expiración de Permisos
- Usar `expiresAt` para permisos temporales
- Implementar renovación automática cuando sea necesario

## 🚀 Próximos Pasos

1. **Implementar Guards**: Crear guards de NestJS para verificar permisos
2. **Decorators**: Crear decorators para endpoints protegidos
3. **UI de Administración**: Interfaz para gestionar grupos y permisos
4. **Cache**: Implementar cache de permisos para mejor performance
5. **Testing**: Crear tests para el sistema de permisos

---

*Este sistema proporciona una base sólida y flexible para la gestión de permisos en aplicaciones complejas.*
