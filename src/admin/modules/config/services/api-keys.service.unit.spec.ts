import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APIKeysService } from './api-keys.service';
import { EncryptionService } from './encryption.service';
import { PrismaService } from '../../../../../src/prisma/prisma.service';
import { jest } from '@jest/globals';
import {
  CreateAPIKeyDto,
  UpdateAPIKeyDto,
  APIKeyListQueryDto,
} from '../dtos/api-key.dto';
import {
  setupUnitTestModule,
  testUtils,
} from '../../../../../test/setup/unit-setup';

// Helper function to create complete API key mocks
const createMockAPIKey = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Test API Key',
  service: 'stripe',
  environment: 'production',
  keyType: 'secret',
  encryptedKey: 'encrypted:key:data',
  keyHash: 'hash_value',
  description: null,
  expiresAt: null,
  lastRotated: null,
  rotationPolicy: null,
  isActive: true,
  isPrimary: false,
  accessLevel: 'write',
  lastUsed: null,
  usageCount: 0,
  errorCount: 0,
  rateLimit: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin',
  updatedBy: 'admin',
  ...overrides,
});

// Mock ConfigService
const mockConfigService = {
  get: jest.fn().mockReturnValue('test-encryption-key'),
};

// Mock EncryptionService
const mockEncryptionService = {
  encryptAPIKey: jest.fn(),
  decryptAPIKey: jest.fn(),
  generateSecureAPIKey: jest.fn(),
};

describe('APIKeysService', () => {
  let service: APIKeysService;
  let prismaService: jest.Mocked<PrismaService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  beforeEach(async () => {
    const module: TestingModule = await setupUnitTestModule({
      providers: [
        APIKeysService,
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    service = module.get<APIKeysService>(APIKeysService);
    prismaService = jest.mocked(module.get<PrismaService>(PrismaService));
    encryptionService = jest.mocked(
      module.get<EncryptionService>(EncryptionService),
    );

    testUtils.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new API key successfully', async () => {
      const createDto: CreateAPIKeyDto = {
        name: 'Stripe Production Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        keyValue: 'sk_live_1234567890abcdef',
        description: 'Primary Stripe secret key',
        accessLevel: 'write',
        isPrimary: true,
        tags: ['payment', 'critical'],
      };

      const mockEncrypted = {
        encrypted: 'encrypted_data',
        iv: 'iv_data',
        tag: 'tag_data',
      };

      const expectedResult = {
        id: 1,
        name: createDto.name,
        service: createDto.service,
        environment: createDto.environment,
        keyType: createDto.keyType,
        description: createDto.description,
        expiresAt: null,
        lastRotated: null,
        rotationPolicy: null,
        isActive: true,
        isPrimary: createDto.isPrimary,
        accessLevel: createDto.accessLevel,
        lastUsed: null,
        usageCount: 0,
        errorCount: 0,
        rateLimit: null,
        tags: createDto.tags,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      encryptionService.encryptAPIKey.mockReturnValue({
        ...mockEncrypted,
        hash: 'hash_value',
      });
      prismaService.aPIKey.create.mockResolvedValue(
        createMockAPIKey({
          id: 1,
          ...createDto,
          encryptedKey: `${mockEncrypted.encrypted}:${mockEncrypted.iv}:${mockEncrypted.tag}`,
          keyHash: 'hash_value',
          isActive: true,
          usageCount: 0,
          errorCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: createDto.description,
          isPrimary: createDto.isPrimary,
          accessLevel: createDto.accessLevel,
          tags: createDto.tags,
        }),
      );
      prismaService.aPIKey.findFirst.mockResolvedValue(null); // No existing key

      const result = await service.create(createDto, 'admin');

      expect(encryptionService.encryptAPIKey).toHaveBeenCalledWith(
        createDto.keyValue,
      );
      expect(prismaService.aPIKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          service: createDto.service,
          environment: createDto.environment,
          keyType: createDto.keyType,
          encryptedKey: expect.stringContaining('encrypted_data'),
          keyHash: 'hash_value',
          isActive: true,
          isPrimary: true,
        }),
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException for duplicate name', async () => {
      const createDto: CreateAPIKeyDto = {
        name: 'Existing Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        keyValue: 'sk_live_1234567890abcdef',
      };

      prismaService.aPIKey.findFirst.mockResolvedValue(
        createMockAPIKey({
          id: 1,
          name: 'Existing Key',
        }),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException for duplicate primary key', async () => {
      const createDto: CreateAPIKeyDto = {
        name: 'New Primary Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        keyValue: 'sk_live_1234567890abcdef',
        isPrimary: true,
      };

      prismaService.aPIKey.findFirst.mockResolvedValue(
        createMockAPIKey({
          id: 1,
          name: 'Existing Primary',
          service: 'stripe',
          environment: 'production',
          keyType: 'secret',
          isPrimary: true,
        }),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create key with default values', async () => {
      const createDto: CreateAPIKeyDto = {
        name: 'Minimal Key',
        service: 'twilio',
        environment: 'development',
        keyType: 'public',
        keyValue: 'some_key_value',
      };

      const expectedResult = {
        id: 2,
        name: createDto.name,
        service: createDto.service,
        environment: createDto.environment,
        keyType: createDto.keyType,
        description: null,
        expiresAt: null,
        lastRotated: null,
        rotationPolicy: null,
        isActive: true,
        isPrimary: false,
        accessLevel: 'read',
        lastUsed: null,
        usageCount: 0,
        errorCount: 0,
        rateLimit: null,
        tags: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: undefined,
        updatedBy: undefined,
      };

      encryptionService.encryptAPIKey.mockReturnValue({
        encrypted: 'encrypted',
        iv: 'key',
        tag: 'tag',
        hash: 'hash',
      });
      prismaService.aPIKey.create.mockResolvedValue(
        createMockAPIKey({
          id: 2,
          ...createDto,
          encryptedKey: 'encrypted:key',
          keyHash: 'hash',
          description: null,
          isPrimary: false,
          accessLevel: 'read',
          isActive: true,
          usageCount: 0,
          errorCount: 0,
          tags: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      prismaService.aPIKey.findFirst.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result.accessLevel).toBe('read');
      expect(result.isPrimary).toBe(false);
      expect(result.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated API keys', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Stripe Key',
          service: 'stripe',
          environment: 'production',
          isActive: true,
        }),
        createMockAPIKey({
          id: 2,
          name: 'Twilio Key',
          service: 'twilio',
          environment: 'production',
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);
      prismaService.aPIKey.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.keys).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by service', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Stripe Key',
          service: 'stripe',
          environment: 'production',
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);
      prismaService.aPIKey.count.mockResolvedValue(1);

      const result = await service.findAll({ service: 'stripe' });

      expect(prismaService.aPIKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ service: 'stripe' }),
        }),
      );
    });

    it('should filter by active status', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Active Key',
          service: 'stripe',
          environment: 'production',
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);
      prismaService.aPIKey.count.mockResolvedValue(1);

      const result = await service.findAll({ isActive: true });

      expect(prismaService.aPIKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by name or service', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Stripe Production',
          service: 'stripe',
          environment: 'production',
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);
      prismaService.aPIKey.count.mockResolvedValue(1);

      const result = await service.findAll({ search: 'stripe' });

      expect(prismaService.aPIKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'stripe', mode: 'insensitive' } },
              { service: { contains: 'stripe', mode: 'insensitive' } },
              { description: { contains: 'stripe', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by tags', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Tagged Key',
          service: 'stripe',
          environment: 'production',
          isActive: true,
          tags: ['critical', 'production'],
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);
      prismaService.aPIKey.count.mockResolvedValue(1);

      const result = await service.findAll({ tags: ['critical'] });

      expect(prismaService.aPIKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ['critical'] },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an API key by id', async () => {
      const mockKey = createMockAPIKey({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        isActive: true,
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(mockKey);

      const result = await service.findOne(1);

      expect(result).toEqual({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        description: null,
        expiresAt: null,
        lastRotated: null,
        rotationPolicy: null,
        isActive: true,
        isPrimary: false,
        accessLevel: 'write',
        lastUsed: null,
        usageCount: 0,
        errorCount: 0,
        rateLimit: null,
        tags: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: 'admin',
        updatedBy: 'admin',
      });
      expect(prismaService.aPIKey.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException for non-existent key', async () => {
      prismaService.aPIKey.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDecryptedKey', () => {
    it('should return decrypted key and update usage', async () => {
      const mockKey = createMockAPIKey({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        encryptedKey: 'encrypted:iv:tag',
        keyHash: 'hash_value',
        isActive: true,
        usageCount: 5,
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(mockKey);
      encryptionService.decryptAPIKey.mockReturnValue('decrypted_key_value');

      const result = await service.getDecryptedKey(1);

      expect(result).toBe('decrypted_key_value');
      expect(encryptionService.decryptAPIKey).toHaveBeenCalledWith(
        'encrypted',
        'iv',
        'tag',
        'hash_value',
      );
      expect(prismaService.aPIKey.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          lastUsed: expect.any(Date),
          usageCount: { increment: 1 },
        },
      });
    });

    it('should throw BadRequestException for inactive key', async () => {
      const mockKey = createMockAPIKey({
        id: 1,
        name: 'Inactive Key',
        service: 'stripe',
        environment: 'production',
        encryptedKey: 'encrypted:iv:tag',
        keyHash: 'hash_value',
        isActive: false,
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(mockKey);

      await expect(service.getDecryptedKey(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update API key successfully', async () => {
      const updateDto: UpdateAPIKeyDto = {
        name: 'Updated Key Name',
        description: 'Updated description',
        accessLevel: 'admin',
        isPrimary: true,
      };

      const existingKey = createMockAPIKey({
        id: 1,
        name: 'Original Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        isPrimary: false,
      });

      const updatedKey = createMockAPIKey({
        id: 1,
        name: 'Updated Key Name',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        description: 'Updated description',
        accessLevel: 'admin',
        isPrimary: true,
        updatedAt: new Date(),
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(existingKey);
      prismaService.aPIKey.update.mockResolvedValue(updatedKey);

      const result = await service.update(1, updateDto, 'admin');

      expect(result.name).toBe('Updated Key Name');
      expect(result.accessLevel).toBe('admin');
    });

    it('should update key value if provided', async () => {
      const updateDto: UpdateAPIKeyDto = {
        keyValue: 'new_secret_key_value',
      };

      const existingKey = createMockAPIKey({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        encryptedKey: 'old:encrypted:key',
      });

      const newEncrypted = {
        encrypted: 'new_encrypted',
        iv: 'new_iv',
        tag: 'new_tag',
        hash: 'new_hash',
      };

      prismaService.aPIKey.findUnique.mockResolvedValue(existingKey);
      encryptionService.encryptAPIKey.mockReturnValue(newEncrypted);
      prismaService.aPIKey.update.mockResolvedValue(
        createMockAPIKey({
          ...existingKey,
          encryptedKey: `${newEncrypted.encrypted}:${newEncrypted.iv}:${newEncrypted.tag}`,
          keyHash: newEncrypted.hash,
          lastRotated: new Date(),
        }),
      );

      await service.update(1, updateDto, 'admin');

      expect(encryptionService.encryptAPIKey).toHaveBeenCalledWith(
        'new_secret_key_value',
      );
      expect(prismaService.aPIKey.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          encryptedKey: 'new_encrypted:new_iv:new_tag',
          keyHash: 'new_hash',
          lastRotated: expect.any(Date),
        }),
      });
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle active status', async () => {
      const existingKey = createMockAPIKey({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        isActive: true,
      });

      const updatedKey = createMockAPIKey({
        ...existingKey,
        isActive: false,
        updatedAt: new Date(),
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(existingKey);
      prismaService.aPIKey.update.mockResolvedValue(updatedKey);

      const result = await service.toggleActive(1, false, 'admin');

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete API key', async () => {
      const existingKey = createMockAPIKey({
        id: 1,
        name: 'Test Key',
        service: 'stripe',
        environment: 'production',
        encryptedKey: 'encrypted:key:data',
      });

      prismaService.aPIKey.findUnique.mockResolvedValue(existingKey);
      prismaService.aPIKey.delete.mockResolvedValue(existingKey);

      const result = await service.remove(1);

      expect(result.message).toContain('deleted successfully');
      expect(prismaService.aPIKey.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findByServiceAndEnvironment', () => {
    it('should return keys for service and environment', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Primary Key',
          service: 'stripe',
          environment: 'production',
          keyType: 'secret',
          isPrimary: true,
          isActive: true,
        }),
        createMockAPIKey({
          id: 2,
          name: 'Secondary Key',
          service: 'stripe',
          environment: 'production',
          keyType: 'secret',
          isPrimary: false,
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.findByServiceAndEnvironment(
        'stripe',
        'production',
      );

      expect(result).toHaveLength(2);
      expect(result[0].isPrimary).toBe(true); // Primary key first
    });

    it('should filter by key type', async () => {
      const mockKeys = [
        createMockAPIKey({
          id: 1,
          name: 'Secret Key',
          service: 'stripe',
          environment: 'production',
          keyType: 'secret',
          isActive: true,
        }),
      ];

      prismaService.aPIKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.findByServiceAndEnvironment(
        'stripe',
        'production',
        'secret',
      );

      expect(result).toHaveLength(1);
      expect(result[0].keyType).toBe('secret');
    });
  });

  describe('createStandardKeys', () => {
    it('should create standard API keys for services', async () => {
      const mockCreatedKey = createMockAPIKey({
        id: 1,
        name: 'Stripe Production Secret Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        accessLevel: 'write',
        isPrimary: true,
        tags: ['payment', 'critical', 'production'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaService.aPIKey.create.mockResolvedValue(mockCreatedKey);
      prismaService.aPIKey.findFirst.mockResolvedValue(null); // No existing key
      mockEncryptionService.generateSecureAPIKey.mockReturnValue(
        'placeholder_key_123',
      );

      const result = await service.createStandardKeys(
        {
          services: ['stripe'],
          environments: ['production'],
        },
        'admin',
      );

      expect(result.created).toBeGreaterThan(0);
      expect(result.message).toContain('Standard API keys creation completed');
      expect(prismaService.aPIKey.create).toHaveBeenCalled();
    });

    it('should skip existing keys', async () => {
      prismaService.aPIKey.findFirst.mockResolvedValue(
        createMockAPIKey({
          id: 1,
          name: 'Existing Stripe Key',
        }),
      );

      const result = await service.createStandardKeys(
        {
          services: ['stripe'],
          environments: ['production'],
        },
        'admin',
      );

      expect(result.created).toBe(0);
      expect(result.errorMessages).toContain(
        'Key "Stripe production Secret Key" already exists',
      );
    });
  });

  describe('bulkUpdate', () => {
    it('should perform bulk updates successfully', async () => {
      const bulkUpdateDto = {
        keyIds: [1, 2, 3],
        updates: {
          isActive: false,
          accessLevel: 'read' as const,
        },
      };

      const mockUpdatedKey = createMockAPIKey({
        id: 1,
        name: 'Updated Key',
        isActive: false,
        accessLevel: 'read',
      });

      // Mock the update method to return a transformed key
      const mockTransformedKey = {
        id: 1,
        name: 'Updated Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        description: null,
        expiresAt: null,
        lastRotated: null,
        rotationPolicy: null,
        isActive: false,
        isPrimary: false,
        accessLevel: 'read',
        lastUsed: null,
        usageCount: 0,
        errorCount: 0,
        rateLimit: null,
        tags: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: 'admin',
        updatedBy: 'admin',
      };

      prismaService.aPIKey.findUnique.mockResolvedValue(
        createMockAPIKey({ id: 1 }),
      );
      prismaService.aPIKey.update.mockResolvedValue(mockUpdatedKey);

      const result = await service.bulkUpdate(bulkUpdateDto, 'admin');

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it('should handle partial failures in bulk update', async () => {
      const bulkUpdateDto = {
        keyIds: [1, 2],
        updates: { isActive: false } as any,
      };

      // Mock findUnique for both keys
      prismaService.aPIKey.findUnique
        .mockResolvedValueOnce(createMockAPIKey({ id: 1 }))
        .mockResolvedValueOnce(createMockAPIKey({ id: 2 }));

      // First update succeeds
      prismaService.aPIKey.update
        .mockResolvedValueOnce(
          createMockAPIKey({
            id: 1,
            name: 'Key 1',
            isActive: false,
          }),
        )
        // Second update fails
        .mockRejectedValueOnce(new Error('Update failed'));

      const result = await service.bulkUpdate(bulkUpdateDto, 'admin');

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('audit logging', () => {
    it('should create audit log for key creation', async () => {
      const createDto: CreateAPIKeyDto = {
        name: 'Audit Test Key',
        service: 'stripe',
        environment: 'production',
        keyType: 'secret',
        keyValue: 'test_key',
      };

      encryptionService.encryptAPIKey.mockReturnValue({
        encrypted: 'enc',
        iv: 'iv',
        tag: 'tag',
        hash: 'hash',
      });

      prismaService.aPIKey.create.mockResolvedValue(
        createMockAPIKey({
          id: 1,
          ...createDto,
          encryptedKey: 'enc:iv:tag',
          keyHash: 'hash',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: createDto.description,
          isPrimary: createDto.isPrimary,
          accessLevel: createDto.accessLevel,
          tags: createDto.tags,
        }),
      );

      prismaService.aPIKey.findFirst.mockResolvedValue(null); // No existing key

      // Mock audit creation
      const mockAuditCreate = jest.fn();
      (service as any).prisma.aPIKeyAudit = { create: mockAuditCreate };

      await service.create(createDto, 'admin');

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: {
          apiKeyId: 1,
          action: 'created',
          oldValue: null,
          newValue: 'enc:iv:tag',
          metadata: {
            metadata: {
              createdBy: 'admin',
              reason: 'Initial creation',
            },
          },
          performedBy: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'APIKeysService',
        },
      });
    });
  });
});
