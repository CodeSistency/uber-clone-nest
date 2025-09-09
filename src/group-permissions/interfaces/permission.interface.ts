export interface PermissionInterface {
  id: number;
  code: string;
  name: string;
  description: string | null;
  module: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupInterface {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermissions {
  userId: number;
  permissions: string[];
  groups: {
    id: number;
    name: string;
    priority: number;
  }[];
}

export interface PermissionCheck {
  userId: number;
  permission: string;
  hasPermission: boolean;
  groupsWithPermission: string[];
}
