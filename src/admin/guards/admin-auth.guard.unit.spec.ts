import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let mockExecutionContext: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminAuthGuard],
    }).compile();

    guard = module.get<AdminAuthGuard>(AdminAuthGuard);

    mockRequest = {
      path: '/admin/test',
      headers: {},
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access to public routes without authentication', () => {
      const publicRoutes = [
        '/',
        '/admin/auth/login',
        '/admin/auth/refresh-token',
      ];

      publicRoutes.forEach((route) => {
        mockRequest.path = route;
        mockExecutionContext
          .switchToHttp()
          .getRequest.mockReturnValue(mockRequest);

        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      });
    });

    it('should allow access to sub-routes of public routes', () => {
      mockRequest.path = '/admin/auth/login/subroute';
      mockExecutionContext
        .switchToHttp()
        .getRequest.mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should require authentication for protected routes', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers.authorization = 'Bearer valid-token';

      // Mock the parent AuthGuard canActivate to return true
      jest.spyOn(guard as any, 'canActivate').mockReturnValueOnce(true);

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers = {}; // No authorization header

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'No token provided',
      );
    });

    it('should throw UnauthorizedException when authorization header is empty', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers.authorization = '';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when authorization header has no Bearer prefix', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers.authorization = 'invalid-token-format';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should extract token from Bearer authorization header', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers.authorization = 'Bearer valid-jwt-token';

      // Mock extractTokenFromHeader to return the token
      jest
        .spyOn(guard as any, 'extractTokenFromHeader')
        .mockReturnValue('valid-jwt-token');

      // Mock parent AuthGuard to succeed
      const parentCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(guard), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      mockRequest.headers.authorization = 'Bearer valid-jwt-token';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBe('valid-jwt-token');
    });

    it('should return undefined for missing authorization header', () => {
      mockRequest.headers = {};

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined for empty authorization header', () => {
      mockRequest.headers.authorization = '';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined for authorization header without Bearer prefix', () => {
      mockRequest.headers.authorization = 'Basic dXNlcjpwYXNz';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined for Bearer header with empty token', () => {
      mockRequest.headers.authorization = 'Bearer ';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should handle case-insensitive Bearer prefix', () => {
      mockRequest.headers.authorization = 'bearer valid-jwt-token';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBe('valid-jwt-token');
    });

    it('should handle extra spaces in Bearer header', () => {
      mockRequest.headers.authorization = 'Bearer  valid-jwt-token  ';

      const token = (guard as any).extractTokenFromHeader(mockRequest);

      expect(token).toBe('valid-jwt-token');
    });
  });

  describe('handleRequest', () => {
    it('should return admin user when authentication succeeds', () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['admin'],
      };

      const result = guard.handleRequest(null, adminUser, null, null);

      expect(result).toBe(adminUser);
    });

    it('should throw UnauthorizedException when authentication fails with error', () => {
      const error = new Error('Invalid token');

      expect(() => guard.handleRequest(error, null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(error, null, null, null)).toThrow(
        'Authentication failed',
      );
    });

    it('should throw UnauthorizedException when no admin user is provided', () => {
      expect(() => guard.handleRequest(null, null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null, null)).toThrow(
        'Authentication failed',
      );
    });

    it('should throw UnauthorizedException when admin user is false', () => {
      expect(() => guard.handleRequest(null, false, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with info message when provided', () => {
      const info = { message: 'Token expired' };

      expect(() => guard.handleRequest(null, null, info, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, info, null)).toThrow(
        'Token expired',
      );
    });

    it('should log detailed error information', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error stack trace';
      const info = { message: 'Token validation failed' };
      const context = { path: '/admin/users' };

      const loggerSpy = jest
        .spyOn((guard as any).logger, 'error')
        .mockImplementation(() => {});

      expect(() => guard.handleRequest(error, null, info, context)).toThrow();

      expect(loggerSpy).toHaveBeenCalledWith('Admin authentication error:', {
        error: 'Database connection failed',
        stack: 'Error stack trace',
        info: 'Token validation failed',
      });
    });
  });

  describe('public routes handling', () => {
    const publicRoutes = [
      '/',
      '/admin/auth/login',
      '/admin/auth/refresh-token',
    ];

    it.each(publicRoutes)('should allow public route: %s', (route) => {
      mockRequest.path = route;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow public route with trailing slash', () => {
      mockRequest.path = '/admin/auth/login/';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow public route subpaths', () => {
      mockRequest.path = '/admin/auth/login/callback';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('protected routes handling', () => {
    const protectedRoutes = [
      '/admin/users',
      '/admin/rides',
      '/admin/drivers',
      '/admin/reports',
      '/admin/settings',
    ];

    it.each(protectedRoutes)(
      'should require authentication for: %s',
      (route) => {
        mockRequest.path = route;
        mockRequest.headers.authorization = ''; // No token

        expect(() => guard.canActivate(mockExecutionContext)).toThrow(
          UnauthorizedException,
        );
      },
    );

    it('should call parent AuthGuard for protected routes with valid token', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers.authorization = 'Bearer valid-token';

      const parentCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(guard), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('logging', () => {
    it('should log warning when no token is found', () => {
      mockRequest.path = '/admin/users';
      mockRequest.headers = {};

      const loggerSpy = jest
        .spyOn((guard as any).logger, 'warn')
        .mockImplementation(() => {});

      expect(() => guard.canActivate(mockExecutionContext)).toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'No token found in request headers in /admin/users',
      );
    });

    it('should log authentication errors with details', () => {
      const error = new Error('Token verification failed');
      const loggerSpy = jest
        .spyOn((guard as any).logger, 'error')
        .mockImplementation(() => {});

      expect(() => guard.handleRequest(error, null, null, null)).toThrow();

      expect(loggerSpy).toHaveBeenCalledWith('Admin authentication error:', {
        error: 'Token verification failed',
        stack: error.stack,
        info: undefined,
      });
    });
  });

  describe('integration with permissions', () => {
    it('should work with authenticated admin user that has permissions', () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['admin', 'users:read', 'users:write'],
      };

      const result = guard.handleRequest(null, adminUser, null, null);

      expect(result).toBe(adminUser);
      expect(result.permissions).toContain('admin');
    });

    it('should work with limited admin user permissions', () => {
      const limitedAdmin = {
        id: 2,
        email: 'limited-admin@example.com',
        role: 'admin',
        permissions: ['users:read', 'rides:read'], // Limited permissions
      };

      const result = guard.handleRequest(null, limitedAdmin, null, null);

      expect(result).toBe(limitedAdmin);
      expect(result.permissions).not.toContain('admin');
      expect(result.permissions).toContain('users:read');
    });
  });
});
