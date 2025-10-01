import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import {
  CreateAPIKeyDto,
  UpdateAPIKeyDto,
  APIKeyListQueryDto,
  APIKeyRotationDto,
  CreateStandardAPIKeysDto,
  BulkAPIKeyUpdateDto,
  APIKeyListItemDto,
} from '../dtos/api-key.dto';

@Injectable()
export class APIKeysService {
  private readonly logger = new Logger(APIKeysService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createDto: CreateAPIKeyDto, createdBy?: string) {
    // Check for unique name
    const existingKey = await this.prisma.aPIKey.findFirst({
      where: { name: createDto.name },
    });

    if (existingKey) {
      throw new ConflictException(
        `API key with name "${createDto.name}" already exists`,
      );
    }

    // Validate primary key constraint
    if (createDto.isPrimary) {
      const existingPrimary = await this.prisma.aPIKey.findFirst({
        where: {
          service: createDto.service,
          environment: createDto.environment,
          keyType: createDto.keyType,
          isPrimary: true,
        },
      });

      if (existingPrimary) {
        throw new ConflictException(
          `Primary key already exists for ${createDto.service}/${createDto.environment}/${createDto.keyType}`,
        );
      }
    }

    // Encrypt the API key
    const encryption = this.encryptionService.encryptAPIKey(createDto.keyValue);

    const apiKey = await this.prisma.aPIKey.create({
      data: {
        name: createDto.name,
        service: createDto.service,
        environment: createDto.environment,
        keyType: createDto.keyType,
        encryptedKey: `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`,
        keyHash: encryption.hash,
        description: createDto.description,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
        rotationPolicy: createDto.rotationPolicy,
        isActive: true,
        isPrimary: createDto.isPrimary ?? false,
        accessLevel: createDto.accessLevel ?? 'read',
        rateLimit: createDto.rateLimit,
        tags: createDto.tags,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Create audit log
    await this.createAuditLog(apiKey.id, 'created', null, apiKey.encryptedKey, {
      metadata: { createdBy, reason: 'Initial creation' },
    });

    this.logger.log(
      `API key created: ${apiKey.name} (${apiKey.service}/${apiKey.environment})`,
    );

    return this.transformAPIKey(apiKey);
  }

  async findAll(query: APIKeyListQueryDto) {
    const {
      search,
      service,
      environment,
      keyType,
      isActive,
      isPrimary,
      tags,
      sortBy = 'service',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { service: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Specific filters
    if (service) where.service = service;
    if (environment) where.environment = environment;
    if (keyType) where.keyType = keyType;
    if (isActive !== undefined) where.isActive = isActive;
    if (isPrimary !== undefined) where.isPrimary = isPrimary;

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const total = await this.prisma.aPIKey.count({ where });

    const apiKeys = await this.prisma.aPIKey.findMany({
      where,
      select: {
        id: true,
        name: true,
        service: true,
        environment: true,
        isActive: true,
        isPrimary: true,
        expiresAt: true,
        usageCount: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      keys: apiKeys.map((key) => this.transformAPIKeyListItem(key)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    return this.transformAPIKey(apiKey);
  }

  async findByServiceAndEnvironment(
    service: string,
    environment: string,
    keyType?: string,
  ) {
    const where: any = {
      service,
      environment,
      isActive: true,
    };

    if (keyType) {
      where.keyType = keyType;
    }

    const apiKeys = await this.prisma.aPIKey.findMany({
      where,
      orderBy: [
        { isPrimary: 'desc' }, // Primary keys first
        { createdAt: 'desc' }, // Then by creation date
      ],
    });

    return apiKeys.map((key) => this.transformAPIKey(key));
  }

  async getDecryptedKey(id: number): Promise<string> {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    if (!apiKey.isActive) {
      throw new BadRequestException('API key is not active');
    }

    // Decrypt the key
    const [encrypted, iv, tag] = apiKey.encryptedKey.split(':');
    const decryptedKey = this.encryptionService.decryptAPIKey(
      encrypted,
      iv,
      tag,
      apiKey.keyHash || undefined,
    );

    // Update usage tracking
    await this.prisma.aPIKey.update({
      where: { id },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
    });

    // Create audit log
    await this.createAuditLog(apiKey.id, 'accessed', null, null, {
      metadata: { accessedBy: 'system', purpose: 'API call' },
    });

    return decryptedKey;
  }

  async update(id: number, updateDto: UpdateAPIKeyDto, updatedBy?: string) {
    const existingKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!existingKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    // Check unique name constraint
    if (updateDto.name && updateDto.name !== existingKey.name) {
      const existingByName = await this.prisma.aPIKey.findFirst({
        where: { name: updateDto.name },
      });

      if (existingByName) {
        throw new ConflictException(
          `API key with name "${updateDto.name}" already exists`,
        );
      }
    }

    // Validate primary key constraint
    if (updateDto.isPrimary && !existingKey.isPrimary) {
      const existingPrimary = await this.prisma.aPIKey.findFirst({
        where: {
          service: updateDto.service || existingKey.service,
          environment: updateDto.environment || existingKey.environment,
          keyType: updateDto.keyType || existingKey.keyType,
          isPrimary: true,
        },
      });

      if (existingPrimary && existingPrimary.id !== id) {
        throw new ConflictException(
          'Primary key already exists for this service/environment/keyType',
        );
      }
    }

    const updateData: any = {
      name: updateDto.name,
      service: updateDto.service,
      environment: updateDto.environment,
      keyType: updateDto.keyType,
      description: updateDto.description,
      expiresAt: updateDto.expiresAt
        ? new Date(updateDto.expiresAt)
        : existingKey.expiresAt,
      rotationPolicy: updateDto.rotationPolicy,
      isPrimary: updateDto.isPrimary,
      accessLevel: updateDto.accessLevel,
      rateLimit: updateDto.rateLimit,
      tags: updateDto.tags,
      updatedBy,
    };

    // Handle key rotation if new key value is provided
    if (updateDto.keyValue) {
      const oldEncryptedKey = existingKey.encryptedKey;
      const encryption = this.encryptionService.encryptAPIKey(
        updateDto.keyValue,
      );

      updateData.encryptedKey = `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`;
      updateData.keyHash = encryption.hash;
      updateData.lastRotated = new Date();

      // Create audit log for rotation
      await this.createAuditLog(
        id,
        'rotated',
        oldEncryptedKey,
        updateData.encryptedKey,
        {
          metadata: { rotatedBy: updatedBy, reason: 'Manual rotation' },
        },
      );
    }

    const updatedKey = await this.prisma.aPIKey.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`API key updated: ${updatedKey.name}`);

    return this.transformAPIKey(updatedKey);
  }

  async remove(id: number) {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    await this.prisma.aPIKey.delete({
      where: { id },
    });

    // Create audit log
    await this.createAuditLog(id, 'deactivated', apiKey.encryptedKey, null, {
      metadata: { deactivatedBy: 'system', reason: 'Deleted' },
    });

    this.logger.log(
      `API key deleted: ${apiKey.name} (${apiKey.service}/${apiKey.environment})`,
    );

    return { message: 'API key deleted successfully' };
  }

  async toggleActive(id: number, active: boolean, updatedBy?: string) {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    const updatedKey = await this.prisma.aPIKey.update({
      where: { id },
      data: {
        isActive: active,
        updatedBy,
      },
    });

    // Create audit log
    await this.createAuditLog(
      id,
      active ? 'activated' : 'deactivated',
      null,
      null,
      {
        metadata: { actionBy: updatedBy, newStatus: active },
      },
    );

    this.logger.log(
      `API key ${active ? 'activated' : 'deactivated'}: ${updatedKey.name}`,
    );

    return this.transformAPIKey(updatedKey);
  }

  async rotateKey(
    id: number,
    rotationDto: APIKeyRotationDto,
    rotatedBy?: string,
  ) {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    const oldEncryptedKey = apiKey.encryptedKey;
    const encryption = this.encryptionService.encryptAPIKey(
      rotationDto.newKeyValue,
    );

    const updatedKey = await this.prisma.aPIKey.update({
      where: { id },
      data: {
        encryptedKey: `${encryption.encrypted}:${encryption.iv}:${encryption.tag}`,
        keyHash: encryption.hash,
        lastRotated: new Date(),
        errorCount: 0, // Reset error count on rotation
        updatedBy: rotatedBy,
      },
    });

    // Create audit log
    await this.createAuditLog(
      id,
      'rotated',
      oldEncryptedKey,
      updatedKey.encryptedKey,
      {
        metadata: {
          rotatedBy,
          reason: rotationDto.reason || 'Manual rotation',
        },
      },
    );

    this.logger.log(`API key rotated: ${updatedKey.name}`);

    return this.transformAPIKey(updatedKey);
  }

  async bulkUpdate(updateDto: BulkAPIKeyUpdateDto, updatedBy?: string) {
    const { keyIds, updates } = updateDto;

    if (!Array.isArray(keyIds) || keyIds.length === 0) {
      throw new BadRequestException('keyIds must be a non-empty array');
    }

    const results: Array<{
      keyId: number;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];
    for (const keyId of keyIds) {
      try {
        const key = await this.update(
          keyId,
          updates as UpdateAPIKeyDto,
          updatedBy,
        );
        results.push({ keyId, success: true, data: key });
      } catch (error) {
        results.push({
          keyId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      message: `Bulk update completed`,
      results,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  async getAnalyticsData(): Promise<any[]> {
    const apiKeys = await this.prisma.aPIKey.findMany({
      select: {
        id: true,
        name: true,
        service: true,
        environment: true,
        keyType: true,
        isActive: true,
        isPrimary: true,
        expiresAt: true,
        usageCount: true,
      },
    });

    return apiKeys.map((key) => this.transformAPIKey(key));
  }

  async createStandardKeys(
    standardDto: CreateStandardAPIKeysDto,
    createdBy?: string,
  ) {
    const {
      services = ['stripe', 'twilio', 'firebase'],
      environments = ['development', 'production'],
    } = standardDto;

    const standardKeys: Array<{
      name: string;
      service: string;
      environment: string;
      keyType: string;
      description: string;
      accessLevel: string;
      isPrimary?: boolean;
      tags: string[];
    }> = [];

    for (const service of services) {
      for (const environment of environments) {
        const serviceKeys = this.getStandardKeysForService(
          service,
          environment,
        );
        standardKeys.push(...serviceKeys);
      }
    }

    const createdKeys: any[] = [];
    const errors: string[] = [];

    for (const keyData of standardKeys) {
      try {
        // Check if key already exists
        const existing = await this.prisma.aPIKey.findFirst({
          where: {
            service: keyData.service,
            environment: keyData.environment,
            keyType: keyData.keyType,
            name: keyData.name,
          },
        });

        if (!existing) {
          // Generate a placeholder key for standard keys
          const placeholderKey = this.encryptionService.generateSecureAPIKey(
            keyData.service,
            32,
          );
          const key = await this.create(
            {
              ...keyData,
              keyValue: placeholderKey, // This would need to be replaced with real keys
            } as CreateAPIKeyDto,
            createdBy,
          );
          createdKeys.push(key);
        } else {
          errors.push(`Key "${keyData.name}" already exists`);
        }
      } catch (error) {
        errors.push(
          `Failed to create "${keyData.name}": ${(error as Error).message}`,
        );
      }
    }

    return {
      message: 'Standard API keys creation completed',
      created: createdKeys.length,
      errors: errors.length,
      keys: createdKeys,
      errorMessages: errors,
      warning:
        'Placeholder keys generated. Replace with real API keys from service providers.',
    };
  }

  private getStandardKeysForService(service: string, environment: string) {
    const isProduction = environment === 'production';

    switch (service) {
      case 'stripe':
        return [
          {
            name: `Stripe ${environment} Secret Key`,
            service: 'stripe',
            environment,
            keyType: 'secret',
            description: `Stripe secret key for ${environment} payments`,
            accessLevel: 'write',
            isPrimary: true,
            tags: ['payment', 'critical', environment],
          },
          {
            name: `Stripe ${environment} Webhook Secret`,
            service: 'stripe',
            environment,
            keyType: 'webhook_secret',
            description: `Stripe webhook secret for ${environment}`,
            accessLevel: 'read',
            tags: ['webhook', environment],
          },
        ];

      case 'twilio':
        return [
          {
            name: `Twilio ${environment} Account SID`,
            service: 'twilio',
            environment,
            keyType: 'access_token',
            description: `Twilio Account SID for ${environment}`,
            accessLevel: 'admin',
            isPrimary: true,
            tags: ['sms', 'communication', environment],
          },
          {
            name: `Twilio ${environment} Auth Token`,
            service: 'twilio',
            environment,
            keyType: 'secret',
            description: `Twilio Auth Token for ${environment}`,
            accessLevel: 'admin',
            tags: ['sms', 'communication', environment],
          },
        ];

      case 'firebase':
        return [
          {
            name: `Firebase ${environment} Service Account Key`,
            service: 'firebase',
            environment,
            keyType: 'private_key',
            description: `Firebase service account key for ${environment}`,
            accessLevel: 'admin',
            isPrimary: true,
            tags: ['notification', 'auth', environment],
          },
          {
            name: `Firebase ${environment} Web API Key`,
            service: 'firebase',
            environment,
            keyType: 'public',
            description: `Firebase Web API key for ${environment}`,
            accessLevel: 'read',
            tags: ['web', 'public', environment],
          },
        ];

      default:
        return [];
    }
  }

  async createAuditLog(
    apiKeyId: number,
    action: string,
    oldValue?: string | null,
    newValue?: string | null,
    metadata?: any,
  ) {
    try {
      await this.prisma.aPIKeyAudit.create({
        data: {
          apiKeyId,
          action,
          oldValue,
          newValue,
          metadata,
          performedBy: 'system', // TODO: Get from JWT context
          ipAddress: '127.0.0.1', // TODO: Get from request
          userAgent: 'APIKeysService', // TODO: Get from request
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  private transformAPIKeyListItem(apiKey: any): APIKeyListItemDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      service: apiKey.service,
      environment: apiKey.environment,
      isActive: apiKey.isActive,
      isPrimary: apiKey.isPrimary,
      expiresAt: apiKey.expiresAt,
      usageCount: Number(apiKey.usageCount),
    };
  }

  private transformAPIKey(apiKey: any) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      service: apiKey.service,
      environment: apiKey.environment,
      keyType: apiKey.keyType,
      description: apiKey.description,
      expiresAt: apiKey.expiresAt,
      lastRotated: apiKey.lastRotated,
      rotationPolicy: apiKey.rotationPolicy,
      isActive: apiKey.isActive,
      isPrimary: apiKey.isPrimary,
      accessLevel: apiKey.accessLevel,
      lastUsed: apiKey.lastUsed,
      usageCount: Number(apiKey.usageCount),
      errorCount: Number(apiKey.errorCount),
      rateLimit: apiKey.rateLimit,
      tags: apiKey.tags,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      createdBy: apiKey.createdBy,
      updatedBy: apiKey.updatedBy,
    };
  }
}
