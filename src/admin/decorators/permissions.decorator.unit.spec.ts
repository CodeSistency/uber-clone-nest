import { RequirePermissions } from './permissions.decorator';
import { AdminPermission } from '../interfaces/admin.interface';
import { SetMetadata } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

describe('RequirePermissions Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SetMetadata with correct parameters for single permission', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    class TestController {
      @RequirePermissions(AdminPermission.RIDES_READ)
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', [
      AdminPermission.RIDES_READ,
    ]);
  });

  it('should call SetMetadata with correct parameters for multiple permissions', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    class TestController {
      @RequirePermissions(
        AdminPermission.RIDES_READ,
        AdminPermission.RIDES_WRITE,
      )
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', [
      AdminPermission.RIDES_READ,
      AdminPermission.RIDES_WRITE,
    ]);
  });

  it('should work with array of permissions', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;
    const permissions = [
      AdminPermission.USERS_READ,
      AdminPermission.USERS_WRITE,
    ];

    class TestController {
      @RequirePermissions(...permissions)
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', permissions);
  });

  it('should work with all admin permissions', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;
    const allPermissions = [
      AdminPermission.RIDES_READ,
      AdminPermission.RIDES_WRITE,
      AdminPermission.USERS_READ,
      AdminPermission.USERS_WRITE,
      AdminPermission.DRIVERS_READ,
      AdminPermission.DRIVERS_WRITE,
      AdminPermission.REPORTS_READ,
      AdminPermission.NOTIFICATIONS_READ,
      AdminPermission.NOTIFICATIONS_WRITE,
      AdminPermission.PRICING_READ,
      AdminPermission.PRICING_WRITE,
      AdminPermission.GEOGRAPHY_READ,
      AdminPermission.GEOGRAPHY_WRITE,
      AdminPermission.CONFIG_READ,
      AdminPermission.CONFIG_WRITE,
      AdminPermission.ADMIN,
    ];

    class TestController {
      @RequirePermissions(...allPermissions)
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', allPermissions);
  });

  it('should be applicable to class level', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    @RequirePermissions(AdminPermission.ADMIN)
    class TestController {
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', [
      AdminPermission.ADMIN,
    ]);
  });

  it('should be applicable to method level', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    class TestController {
      @RequirePermissions(AdminPermission.RIDES_READ)
      testMethod() {}

      @RequirePermissions(AdminPermission.USERS_WRITE)
      anotherMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledTimes(2);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(1, 'permissions', [
      AdminPermission.RIDES_READ,
    ]);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(2, 'permissions', [
      AdminPermission.USERS_WRITE,
    ]);
  });

  it('should handle empty permissions array', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    class TestController {
      @RequirePermissions()
      testMethod() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('permissions', []);
  });

  it('should work with permission combinations for different modules', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;

    class TestController {
      @RequirePermissions(
        AdminPermission.RIDES_READ,
        AdminPermission.USERS_READ,
      )
      getDashboardData() {}

      @RequirePermissions(AdminPermission.PRICING_WRITE)
      updatePricing() {}

      @RequirePermissions(
        AdminPermission.GEOGRAPHY_READ,
        AdminPermission.GEOGRAPHY_WRITE,
      )
      manageGeography() {}

      @RequirePermissions(
        AdminPermission.CONFIG_READ,
        AdminPermission.CONFIG_WRITE,
        AdminPermission.ADMIN,
      )
      systemConfiguration() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledTimes(4);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(1, 'permissions', [
      AdminPermission.RIDES_READ,
      AdminPermission.USERS_READ,
    ]);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(2, 'permissions', [
      AdminPermission.PRICING_WRITE,
    ]);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(3, 'permissions', [
      AdminPermission.GEOGRAPHY_READ,
      AdminPermission.GEOGRAPHY_WRITE,
    ]);
    expect(mockSetMetadata).toHaveBeenNthCalledWith(4, 'permissions', [
      AdminPermission.CONFIG_READ,
      AdminPermission.CONFIG_WRITE,
      AdminPermission.ADMIN,
    ]);
  });

  it('should work with read-only permissions', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;
    const readOnlyPermissions = [
      AdminPermission.RIDES_READ,
      AdminPermission.USERS_READ,
      AdminPermission.DRIVERS_READ,
      AdminPermission.REPORTS_READ,
      AdminPermission.NOTIFICATIONS_READ,
      AdminPermission.PRICING_READ,
      AdminPermission.GEOGRAPHY_READ,
      AdminPermission.CONFIG_READ,
    ];

    class TestController {
      @RequirePermissions(...readOnlyPermissions)
      getData() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith(
      'permissions',
      readOnlyPermissions,
    );
  });

  it('should work with write permissions', () => {
    const mockSetMetadata = SetMetadata as jest.MockedFunction<
      typeof SetMetadata
    >;
    const writePermissions = [
      AdminPermission.RIDES_WRITE,
      AdminPermission.USERS_WRITE,
      AdminPermission.DRIVERS_WRITE,
      AdminPermission.NOTIFICATIONS_WRITE,
      AdminPermission.PRICING_WRITE,
      AdminPermission.GEOGRAPHY_WRITE,
      AdminPermission.CONFIG_WRITE,
    ];

    class TestController {
      @RequirePermissions(...writePermissions)
      modifyData() {}
    }

    expect(mockSetMetadata).toHaveBeenCalledWith(
      'permissions',
      writePermissions,
    );
  });
});
