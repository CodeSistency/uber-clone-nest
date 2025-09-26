import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AdminPermission } from '../interfaces/admin.interface';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockGetRequest: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);

    mockGetRequest = jest.fn().mockReturnValue({
      user: { permissions: [] }, // Default user with empty permissions
    });

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no permissions are required', () => {
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith('permissions', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should return true when user has all required permissions', () => {
      const requiredPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.RIDES_WRITE,
      ];
      const userPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.RIDES_WRITE,
        AdminPermission.USERS_READ,
      ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      mockGetRequest.mockReturnValue({
        user: {
          permissions: userPermissions,
        },
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const requiredPermissions = [AdminPermission.RIDES_READ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: null, // No user
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Usuario no autenticado o sin permisos',
      );
    });

    it('should throw ForbiddenException when user has no permissions', () => {
      const requiredPermissions = [AdminPermission.RIDES_READ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      mockGetRequest.mockReturnValue({
        user: {
          permissions: [], // Empty permissions
        },
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Permisos insuficientes. Se requieren: rides:read',
      );
    });

    it('should throw ForbiddenException when user lacks required permissions', () => {
      const requiredPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.RIDES_WRITE,
      ];
      const userPermissions = [AdminPermission.RIDES_READ]; // Missing RIDES_WRITE

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        `Permisos insuficientes. Se requieren: ${requiredPermissions.join(', ')}`,
      );
    });

    it('should handle single permission requirement', () => {
      const requiredPermissions = [AdminPermission.USERS_READ];
      const userPermissions = [
        AdminPermission.USERS_READ,
        AdminPermission.USERS_WRITE,
      ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle multiple permission requirements - all must be satisfied', () => {
      const requiredPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.USERS_READ,
        AdminPermission.DRIVERS_READ,
      ];
      const userPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.USERS_READ,
        AdminPermission.DRIVERS_READ,
        AdminPermission.DRIVERS_WRITE,
      ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should fail when user has some but not all required permissions', () => {
      const requiredPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.USERS_READ,
        AdminPermission.DRIVERS_READ,
      ];
      const userPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.USERS_READ,
        // Missing DRIVERS_READ
        AdminPermission.DRIVERS_WRITE,
      ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should work with different permission combinations', () => {
      const testCases = [
        {
          required: [AdminPermission.RIDES_READ],
          userHas: [AdminPermission.RIDES_READ, AdminPermission.RIDES_WRITE],
          expected: true,
        },
        {
          required: [AdminPermission.USERS_WRITE],
          userHas: [AdminPermission.USERS_READ], // Missing write permission
          expected: false,
        },
        {
          required: [
            AdminPermission.DRIVERS_READ,
            AdminPermission.DRIVERS_WRITE,
          ],
          userHas: [
            AdminPermission.DRIVERS_READ,
            AdminPermission.DRIVERS_WRITE,
            AdminPermission.RIDES_READ,
          ],
          expected: true,
        },
        {
          required: [
            AdminPermission.GEOGRAPHY_READ,
            AdminPermission.GEOGRAPHY_WRITE,
          ],
          userHas: [AdminPermission.GEOGRAPHY_READ], // Missing write permission
          expected: false,
        },
      ];

      testCases.forEach(({ required, userHas, expected }) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);

        const mockRequest = {
          user: {
            permissions: userHas,
          },
        };

        mockExecutionContext.switchToHttp().getRequest = jest
          .fn()
          .mockReturnValue(mockRequest);

        if (expected) {
          expect(guard.canActivate(mockExecutionContext)).toBe(true);
        } else {
          expect(() => guard.canActivate(mockExecutionContext)).toThrow(
            ForbiddenException,
          );
        }
      });
    });

    it('should handle empty permissions array', () => {
      const requiredPermissions: AdminPermission[] = [];
      const userPermissions = [AdminPermission.RIDES_READ];

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      // Empty required permissions should always pass
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should work with super admin permissions', () => {
      const requiredPermissions = [AdminPermission.RIDES_READ];
      const userPermissions = [
        AdminPermission.RIDES_READ,
        AdminPermission.RIDES_WRITE,
        AdminPermission.USERS_READ,
        AdminPermission.DRIVERS_READ,
        AdminPermission.ANALYTICS_READ,
        AdminPermission.SYSTEM_CONFIG_READ,
      ]; // Super admin should have all permissions

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const mockRequest = {
        user: {
          permissions: userPermissions,
          role: 'super_admin',
        },
      };

      mockExecutionContext.switchToHttp().getRequest = jest
        .fn()
        .mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });
});
