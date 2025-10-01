import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsCacheService } from './feature-flags-cache.service';
import { PrismaService } from '../../../../../src/prisma/prisma.service';
import { jest } from '@jest/globals';
import {
  CreateFeatureFlagDto,
  FeatureFlagEvaluationDto,
} from '../dtos/feature-flag.dto';
import {
  setupUnitTestModule,
  testUtils,
} from '../../../../../test/setup/unit-setup';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let cacheService: jest.Mocked<FeatureFlagsCacheService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await setupUnitTestModule({
      providers: [FeatureFlagsService, FeatureFlagsCacheService],
    });

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    cacheService = jest.mocked(
      module.get<FeatureFlagsCacheService>(FeatureFlagsCacheService),
    );
    prismaService = jest.mocked(module.get<PrismaService>(PrismaService));

    testUtils.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new feature flag', async () => {
      const createDto: CreateFeatureFlagDto = {
        name: 'New Payment Flow',
        key: 'new_payment_flow',
        description: 'Enables the new redesigned payment processing flow',
        category: 'payments',
        isEnabled: false,
        rolloutPercentage: 50,
        userRoles: ['premium_user'],
        environments: ['staging', 'production'],
        isActive: true,
        autoEnable: false,
      };

      const expectedResult = {
        id: 1,
        name: createDto.name,
        key: createDto.key,
        description: createDto.description || null,
        category: createDto.category,
        isEnabled: createDto.isEnabled ?? false,
        config: null,
        rolloutPercentage: createDto.rolloutPercentage ?? 100,
        userRoles: createDto.userRoles
          ? JSON.parse(JSON.stringify(createDto.userRoles))
          : null,
        userIds: undefined,
        environments: createDto.environments
          ? JSON.parse(JSON.stringify(createDto.environments))
          : null,
        isActive: createDto.isActive ?? true,
        autoEnable: createDto.autoEnable ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      (
        prismaService.featureFlag.create as jest.MockedFunction<any>
      ).mockResolvedValue(expectedResult);

      const result = await service.create(createDto, 'admin');

      expect(prismaService.featureFlag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          key: createDto.key,
          category: createDto.category,
          isEnabled: createDto.isEnabled,
          rolloutPercentage: createDto.rolloutPercentage,
        }),
      });
      expect(result).toEqual(expectedResult);
    });

    it('should create flag with default values', async () => {
      const createDto: CreateFeatureFlagDto = {
        name: 'Test Feature',
        key: 'test_feature',
        category: 'system',
      };

      const expectedResult = {
        id: 2,
        name: createDto.name,
        key: createDto.key,
        description: null,
        category: createDto.category,
        isEnabled: false,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      (
        prismaService.featureFlag.create as jest.MockedFunction<any>
      ).mockResolvedValue(expectedResult);

      const result = await service.create(createDto, 'admin');

      expect(result.rolloutPercentage).toBe(100);
      expect(result.isActive).toBe(true);
      expect(result.isEnabled).toBe(false);
    });

    it('should throw error for duplicate key', async () => {
      const createDto: CreateFeatureFlagDto = {
        name: 'Test Feature',
        key: 'existing_key',
        category: 'system',
      };

      // Mock findUnique to return existing flag
      prismaService.featureFlag.findUnique.mockResolvedValue({
        id: 1,
        name: 'Existing Feature',
        key: 'existing_key',
        description: null,
        category: 'system',
        isEnabled: true,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      await expect(service.create(createDto, 'admin')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByKey', () => {
    it('should return feature flag by key', async () => {
      const mockFlag = {
        id: 1,
        key: 'test_feature',
        isEnabled: true,
        rolloutPercentage: 100,
        isActive: true,
        userRoles: ['premium_user'],
        userIds: [1, 2, 3],
        environments: ['production'],
        config: { maxAmount: 1000 },
        lastUpdated: new Date(),
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);

      const result = await service.findByKey('test_feature');

      expect(result).toEqual(mockFlag);
      expect(cacheService.getCachedFlag).toHaveBeenCalledWith('test_feature');
    });

    it('should throw NotFoundException for non-existent key', async () => {
      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(null);
      prismaService.featureFlag.findUnique.mockResolvedValue(null);

      await expect(service.findByKey('non_existent_key')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evaluateFeature', () => {
    it('should evaluate feature flag correctly - enabled and in rollout', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'test_feature',
        userId: 1,
        userRole: 'premium_user',
        environment: 'production',
      };

      const mockFlag = {
        id: 1,
        name: 'Test Feature',
        key: 'test_feature',
        category: 'system',
        isEnabled: true,
        rolloutPercentage: 100,
        userRoles: ['premium_user'],
        environments: ['production'],
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(true);
      expect(result.isTargeted).toBe(true);
      expect(result.isInRollout).toBe(true);
    });

    it('should return disabled for inactive flag', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'inactive_feature',
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(null);
      prismaService.featureFlag.findUnique.mockResolvedValue({
        id: 1,
        name: 'Inactive Feature',
        key: 'inactive_feature',
        description: null,
        category: 'system',
        isEnabled: true,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: false, // Inactive
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      });

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(false);
      expect(result.isTargeted).toBe(false);
    });

    it('should check user role targeting', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'role_specific_feature',
        userRole: 'basic_user',
      };

      const mockFlag = {
        id: 1,
        name: 'Role Specific Feature',
        key: 'role_specific_feature',
        category: 'system',
        isEnabled: true,
        rolloutPercentage: 100,
        userRoles: ['premium_user', 'admin'], // Only premium and admin
        environments: ['production'],
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(false); // basic_user not in allowed roles
      expect(result.isTargeted).toBe(false);
    });

    it('should check environment targeting', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'env_specific_feature',
        environment: 'staging',
      };

      const mockFlag = {
        id: 1,
        key: 'env_specific_feature',
        isEnabled: true,
        rolloutPercentage: 100,
        environments: ['production'], // Only production
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(false); // staging not in allowed environments
      expect(result.isTargeted).toBe(false);
    });

    it('should apply rollout percentage', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'rollout_feature',
        userId: 1,
      };

      const mockFlag = {
        id: 1,
        key: 'rollout_feature',
        isEnabled: true,
        rolloutPercentage: 50, // Only 50% of users
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      // Mock hash function to return a value within rollout percentage
      jest.spyOn(service as any, 'hashUserId').mockReturnValue(25); // Within 0-49 range

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(true);
      expect(result.isInRollout).toBe(true);
      expect(result.rolloutPercentage).toBe(50);
    });

    it('should exclude users outside rollout percentage', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'rollout_feature',
        userId: 2,
      };

      const mockFlag = {
        id: 1,
        key: 'rollout_feature',
        isEnabled: true,
        rolloutPercentage: 50,
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      // Mock hash function to return a value outside rollout percentage
      jest.spyOn(service as any, 'hashUserId').mockReturnValue(75); // Outside 0-49 range

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(false);
      expect(result.isInRollout).toBe(false);
    });

    it('should check specific user targeting', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'user_specific_feature',
        userId: 123,
      };

      const mockFlag = {
        id: 1,
        key: 'user_specific_feature',
        isEnabled: true,
        rolloutPercentage: 100,
        userIds: [123, 456, 789], // Specific users
        isActive: true,
      };

      jest.spyOn(cacheService, 'getCachedFlag').mockResolvedValue(mockFlag);
      jest.spyOn(cacheService, 'getCachedEvaluation').mockResolvedValue(null);

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(true);
      expect(result.isTargeted).toBe(true);
    });

    it('should use cached evaluation when available', async () => {
      const evaluationDto: FeatureFlagEvaluationDto = {
        featureKey: 'cached_feature',
        userId: 1,
        userRole: 'premium_user',
        environment: 'production',
      };

      const cachedEvaluation = {
        featureKey: 'cached_feature',
        userId: 1,
        userRole: 'premium_user',
        environment: 'production',
        result: true,
        config: { maxAmount: 1000 },
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      };

      const getCachedFlagSpy = jest.spyOn(cacheService, 'getCachedFlag');
      jest
        .spyOn(cacheService, 'getCachedEvaluation')
        .mockResolvedValue(cachedEvaluation);

      const result = await service.evaluateFeature(evaluationDto);

      expect(result.isEnabled).toBe(true);
      expect(result.config).toEqual({ maxAmount: 1000 });
      // Should not call database methods when cache is available
      expect(getCachedFlagSpy).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update feature flag', async () => {
      const updateDto = {
        name: 'Updated Feature',
        key: 'test_feature',
        category: 'system',
        isEnabled: true,
        rolloutPercentage: 75,
      };

      const existingFlag = {
        id: 1,
        name: 'Original Feature',
        key: 'test_feature',
        description: null,
        category: 'system',
        isEnabled: false,
        config: null,
        rolloutPercentage: 50,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      const updatedFlag = {
        id: 1,
        name: 'Updated Feature',
        key: 'test_feature',
        description: null,
        category: 'system',
        isEnabled: true,
        config: null,
        rolloutPercentage: 75,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: 'admin',
      };

      prismaService.featureFlag.findUnique.mockResolvedValue(existingFlag);
      prismaService.featureFlag.update.mockResolvedValue(updatedFlag);
      cacheService.invalidateFlagCache = jest.fn();

      const result = await service.update(1, updateDto, 'admin');

      expect(result.name).toBe('Updated Feature');
      expect(result.isEnabled).toBe(true);
      expect(result.rolloutPercentage).toBe(75);
      expect(cacheService.invalidateFlagCache).toHaveBeenCalledWith(
        'test_feature',
      );
    });

    it('should throw NotFoundException for non-existent flag', async () => {
      prismaService.featureFlag.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          name: 'Test',
          key: 'test_key',
          category: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleEnabled', () => {
    it('should toggle feature flag enabled status', async () => {
      const existingFlag = {
        id: 1,
        name: 'Test Feature',
        key: 'test_feature',
        description: null,
        category: 'system',
        isEnabled: false,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      const updatedFlag = {
        id: 1,
        name: 'Test Feature',
        key: 'test_feature',
        description: null,
        category: 'system',
        isEnabled: true,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: 'admin',
      };

      prismaService.featureFlag.findUnique.mockResolvedValue(existingFlag);
      prismaService.featureFlag.update.mockResolvedValue(updatedFlag);
      cacheService.invalidateFlagCache = jest.fn();

      const result = await service.toggleEnabled(1, true, 'admin');

      expect(result.isEnabled).toBe(true);
      expect(cacheService.invalidateFlagCache).toHaveBeenCalledWith(
        'test_feature',
      );
    });
  });

  describe('createStandardFlags', () => {
    it('should create standard feature flags', async () => {
      prismaService.featureFlag.create.mockResolvedValue({
        id: 1,
        name: 'New Payment Flow',
        key: 'new_payment_flow',
        description: null,
        category: 'payments',
        isEnabled: false,
        config: null,
        rolloutPercentage: 0,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      });

      const result = await service.createStandardFlags({});

      expect(result.message).toContain(
        'Standard feature flags creation completed',
      );
      expect(result.created).toBeGreaterThan(0);
      expect(prismaService.featureFlag.create).toHaveBeenCalled();
    });
  });

  describe('bulk operations', () => {
    it('should perform bulk updates', async () => {
      const bulkUpdateDto = {
        flagIds: [1, 2, 3],
        updates: {
          isEnabled: true,
          rolloutPercentage: 100,
        },
      };

      // Mock findUnique to return existing flags
      (
        prismaService.featureFlag.findUnique as jest.MockedFunction<any>
      ).mockResolvedValue({
        id: 1,
        name: 'Flag 1',
        key: 'flag_1',
        description: null,
        category: 'system',
        isEnabled: false,
        config: null,
        rolloutPercentage: 50,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      // Mock update to return updated flags
      (
        prismaService.featureFlag.update as jest.MockedFunction<any>
      ).mockResolvedValue({
        id: 1,
        name: 'Flag 1',
        key: 'flag_1',
        description: null,
        category: 'system',
        isEnabled: true,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: 'admin',
      } as any);

      const result = await service.bulkUpdate(bulkUpdateDto, 'admin');

      expect(result.message).toContain('Bulk update completed');
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });
  });

  describe('cache integration', () => {
    it('should set cache when creating flag', async () => {
      const createDto: CreateFeatureFlagDto = {
        name: 'Cached Feature',
        key: 'cached_feature',
        category: 'system',
      };

      const createdFlag = {
        id: 1,
        name: createDto.name,
        key: createDto.key,
        description: null,
        category: createDto.category,
        isEnabled: false,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      prismaService.featureFlag.create.mockResolvedValue(createdFlag);
      cacheService.setCachedFlag = jest.fn();

      await service.create(createDto, 'admin');

      expect(cacheService.setCachedFlag).toHaveBeenCalledWith(createdFlag);
    });

    it('should invalidate cache when updating flag', async () => {
      const existingFlag = {
        id: 1,
        name: 'Test Feature',
        key: 'test_feature',
        description: null,
        category: 'system',
        isEnabled: false,
        config: null,
        rolloutPercentage: 100,
        userRoles: null,
        userIds: null,
        environments: null,
        isActive: true,
        autoEnable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      prismaService.featureFlag.findUnique.mockResolvedValue(existingFlag);
      prismaService.featureFlag.update.mockResolvedValue({
        ...existingFlag,
        isEnabled: true,
        updatedBy: 'admin',
      });
      cacheService.invalidateFlagCache = jest.fn();

      await service.update(
        1,
        {
          name: 'Test Feature',
          key: 'test_feature',
          category: 'test',
          isEnabled: true,
        },
        'admin',
      );

      expect(cacheService.invalidateFlagCache).toHaveBeenCalledWith(
        'test_feature',
      );
    });
  });

  describe('hash function', () => {
    it('should generate consistent hash for user ID', () => {
      const hash1 = (service as any).hashUserId(123);
      const hash2 = (service as any).hashUserId(123);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThanOrEqual(99);
    });

    it('should generate different hashes for different IDs', () => {
      const hash1 = (service as any).hashUserId(123);
      const hash2 = (service as any).hashUserId(456);

      // Should be different (with high probability)
      expect(hash1).not.toBe(hash2);
    });
  });
});
