import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagListQueryDto,
  FeatureFlagEvaluationDto,
  CreateStandardFeatureFlagsDto,
  BulkFeatureFlagUpdateDto,
} from '../dtos/feature-flag.dto';
import { FeatureFlagsCacheService } from './feature-flags-cache.service';
import { createHash } from 'crypto';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: FeatureFlagsCacheService,
  ) {}

  async create(createDto: CreateFeatureFlagDto, createdBy?: string) {
    // Check for unique key
    const existingFlag = await this.prisma.featureFlag.findUnique({
      where: { key: createDto.key },
    });

    if (existingFlag) {
      throw new ConflictException(
        `Feature flag with key "${createDto.key}" already exists`,
      );
    }

    // Validate rollout percentage
    if (
      createDto.rolloutPercentage !== undefined &&
      (createDto.rolloutPercentage < 0 || createDto.rolloutPercentage > 100)
    ) {
      throw new BadRequestException(
        'Rollout percentage must be between 0 and 100',
      );
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        name: createDto.name,
        key: createDto.key,
        description: createDto.description,
        category: createDto.category,
        isEnabled: createDto.autoEnable ? true : (createDto.isEnabled ?? false),
        config: createDto.config,
        rolloutPercentage: createDto.rolloutPercentage ?? 100,
        userRoles: createDto.userRoles,
        userIds: createDto.userIds,
        environments: createDto.environments,
        isActive: createDto.isActive ?? true,
        autoEnable: createDto.autoEnable ?? false,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Cache the new flag
    await this.cacheService.setCachedFlag(flag);

    this.logger.log(`Feature flag created: ${flag.name} (${flag.key})`);

    return this.transformFlag(flag);
  }

  async findAll(query: FeatureFlagListQueryDto) {
    const {
      search,
      category,
      isEnabled,
      isActive,
      sortBy = 'name',
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
        { key: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Status filters
    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await this.prisma.featureFlag.count({ where });

    const flags = await this.prisma.featureFlag.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      flags: flags.map((flag) => this.transformFlag(flag)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    // Cache the flag for future use
    await this.cacheService.setCachedFlag(flag);

    return this.transformFlag(flag);
  }

  async findByKey(key: string) {
    // Try cache first
    let flag = await this.cacheService.getCachedFlag(key);

    if (!flag) {
      // Cache miss, fetch from database
      const dbFlag = await this.prisma.featureFlag.findUnique({
        where: { key },
      });

      if (!dbFlag) {
        throw new NotFoundException(`Feature flag with key "${key}" not found`);
      }

      // Cache the flag
      await this.cacheService.setCachedFlag(dbFlag);
      flag = this.transformFlag(dbFlag);
    }

    return this.transformFlag(flag);
  }

  async update(
    id: number,
    updateDto: UpdateFeatureFlagDto,
    updatedBy?: string,
  ) {
    const existingFlag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!existingFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    // Check unique key constraint
    if (updateDto.key && updateDto.key !== existingFlag.key) {
      const existingByKey = await this.prisma.featureFlag.findUnique({
        where: { key: updateDto.key },
      });

      if (existingByKey) {
        throw new ConflictException(
          `Feature flag with key "${updateDto.key}" already exists`,
        );
      }
    }

    // Validate rollout percentage
    if (
      updateDto.rolloutPercentage !== undefined &&
      (updateDto.rolloutPercentage < 0 || updateDto.rolloutPercentage > 100)
    ) {
      throw new BadRequestException(
        'Rollout percentage must be between 0 and 100',
      );
    }

    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        name: updateDto.name,
        key: updateDto.key,
        description: updateDto.description,
        category: updateDto.category,
        isEnabled: updateDto.isEnabled,
        config: updateDto.config,
        rolloutPercentage: updateDto.rolloutPercentage,
        userRoles: updateDto.userRoles,
        userIds: updateDto.userIds,
        environments: updateDto.environments,
        isActive: updateDto.isActive,
        autoEnable: updateDto.autoEnable,
        updatedBy,
      },
    });

    // Invalidate cache for the updated flag
    await this.cacheService.invalidateFlagCache(updatedFlag.key);

    // Cache the updated flag
    await this.cacheService.setCachedFlag(updatedFlag);

    this.logger.log(
      `Feature flag updated: ${updatedFlag.name} (${updatedFlag.key})`,
    );

    return this.transformFlag(updatedFlag);
  }

  async remove(id: number) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    await this.prisma.featureFlag.delete({
      where: { id },
    });

    // Invalidate cache for the deleted flag
    await this.cacheService.invalidateFlagCache(flag.key);

    this.logger.log(`Feature flag deleted: ${flag.name} (${flag.key})`);

    return { message: 'Feature flag deleted successfully' };
  }

  async toggleEnabled(id: number, enabled: boolean, updatedBy?: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }

    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        isEnabled: enabled,
        updatedBy,
      },
    });

    // Invalidate cache for the toggled flag
    await this.cacheService.invalidateFlagCache(updatedFlag.key);

    // Cache the updated flag
    await this.cacheService.setCachedFlag(updatedFlag);

    this.logger.log(
      `Feature flag ${enabled ? 'enabled' : 'disabled'}: ${updatedFlag.name} (${updatedFlag.key})`,
    );

    return this.transformFlag(updatedFlag);
  }

  async evaluateFeature(evaluationDto: FeatureFlagEvaluationDto) {
    const { featureKey, userId, userRole, environment } = evaluationDto;

    // Try cache first for evaluations
    const cachedEvaluation = await this.cacheService.getCachedEvaluation(
      featureKey,
      userId,
      userRole,
      environment,
    );

    if (cachedEvaluation) {
      return {
        featureKey,
        isEnabled: cachedEvaluation.result,
        isTargeted: true, // If cached, it was previously targeted
        rolloutPercentage: 100, // Simplified for cache
        isInRollout: true,
        config: cachedEvaluation.config,
        context: { userId, userRole, environment },
      };
    }

    // Get flag from cache or database
    let flag = await this.cacheService.getCachedFlag(featureKey);

    if (!flag) {
      // Cache miss, fetch from database
      const dbFlag = await this.prisma.featureFlag.findUnique({
        where: { key: featureKey },
      });

      if (dbFlag) {
        await this.cacheService.setCachedFlag(dbFlag);
        flag = this.transformFlag(dbFlag);
      }
    }

    if (!flag || !flag.isActive) {
      // Cache negative result
      await this.cacheService.setCachedEvaluation(
        featureKey,
        userId,
        userRole,
        environment,
        false,
      );
      return {
        featureKey,
        isEnabled: false,
        isTargeted: false,
        rolloutPercentage: 0,
        isInRollout: false,
        config: null,
        context: { userId, userRole, environment },
      };
    }

    // Check user targeting
    const isUserTargeted = this.checkUserTargeting(flag, userId, userRole);

    // Check environment targeting
    const isEnvironmentTargeted = this.checkEnvironmentTargeting(
      flag,
      environment,
    );

    // Combined targeting: if any targeting is specified, user must match all specified criteria
    const hasUserTargeting = flag.userRoles || flag.userIds;
    const hasEnvironmentTargeting = flag.environments;
    const isTargeted =
      hasUserTargeting || hasEnvironmentTargeting
        ? isUserTargeted && isEnvironmentTargeted
        : true; // If no targeting specified, all users are targeted

    // Check rollout percentage
    const userHash = userId ? this.hashUserId(userId) : 0;
    const isInRollout = userHash <= (flag.rolloutPercentage || 100);

    const isEnabled =
      flag.isEnabled && isTargeted && isEnvironmentTargeted && isInRollout;

    // Cache the evaluation result
    await this.cacheService.setCachedEvaluation(
      featureKey,
      userId,
      userRole,
      environment,
      isEnabled,
      flag.config,
    );

    return {
      featureKey,
      isEnabled,
      isTargeted,
      rolloutPercentage: flag.rolloutPercentage || 100,
      isInRollout,
      config: flag.config,
      context: { userId, userRole, environment, userHash },
    };
  }

  async createStandardFlags(
    standardDto: CreateStandardFeatureFlagsDto,
    createdBy?: string,
  ) {
    const {
      categories = [
        'payments',
        'rides',
        'admin',
        'notifications',
        'geography',
        'pricing',
        'system',
      ],
    } = standardDto;

    const standardFlags = [
      // Payments
      ...(categories.includes('payments')
        ? [
            {
              name: 'New Payment Flow',
              key: 'new_payment_flow',
              category: 'payments',
              description: 'Enable new payment processing system',
              rolloutPercentage: 50,
              userRoles: ['user'],
              environments: ['dev', 'staging'],
            },
            {
              name: 'Digital Wallets',
              key: 'digital_wallets',
              category: 'payments',
              description: 'Enable digital wallet functionality',
              rolloutPercentage: 100,
              userRoles: ['user', 'driver'],
            },
            {
              name: 'Multi-Currency Support',
              key: 'multi_currency',
              category: 'payments',
              description: 'Support multiple currencies in payments',
              rolloutPercentage: 25,
            },
          ]
        : []),

      // Rides
      ...(categories.includes('rides')
        ? [
            {
              name: 'Ride Sharing Pooling',
              key: 'ride_pooling',
              category: 'rides',
              description: 'Enable ride pooling for cost sharing',
              rolloutPercentage: 30,
              userRoles: ['user'],
            },
            {
              name: 'Priority Pickup',
              key: 'priority_pickup',
              category: 'rides',
              description: 'VIP users get priority pickup',
              userRoles: ['premium_user'],
            },
            {
              name: 'Real-time Route Optimization',
              key: 'route_optimization',
              category: 'rides',
              description: 'Dynamic route optimization for drivers',
              userRoles: ['driver'],
            },
          ]
        : []),

      // Admin
      ...(categories.includes('admin')
        ? [
            {
              name: 'Advanced Analytics Dashboard',
              key: 'advanced_analytics',
              category: 'admin',
              description: 'Enhanced analytics and reporting',
              userRoles: ['admin'],
            },
            {
              name: 'Bulk Operations',
              key: 'bulk_operations',
              category: 'admin',
              description: 'Bulk user and ride management operations',
              userRoles: ['admin', 'manager'],
            },
            {
              name: 'Real-time Monitoring',
              key: 'real_time_monitoring',
              category: 'admin',
              description: 'Real-time system monitoring dashboard',
              userRoles: ['admin'],
            },
          ]
        : []),

      // Notifications
      ...(categories.includes('notifications')
        ? [
            {
              name: 'Push Notifications',
              key: 'push_notifications',
              category: 'notifications',
              description: 'Enable push notifications for mobile apps',
              rolloutPercentage: 80,
              userRoles: ['user', 'driver'],
            },
            {
              name: 'SMS Notifications',
              key: 'sms_notifications',
              category: 'notifications',
              description: 'SMS alerts for important events',
              userRoles: ['user'],
            },
            {
              name: 'Email Templates',
              key: 'email_templates',
              category: 'notifications',
              description: 'Enhanced email templates with personalization',
              userRoles: ['user', 'driver'],
            },
          ]
        : []),

      // Geography
      ...(categories.includes('geography')
        ? [
            {
              name: 'Dynamic Zones',
              key: 'dynamic_zones',
              category: 'geography',
              description: 'Dynamic service zones based on demand',
              environments: ['staging', 'prod'],
            },
            {
              name: 'Geofencing',
              key: 'geofencing',
              category: 'geography',
              description: 'Advanced geofencing for service areas',
              userRoles: ['driver'],
            },
            {
              name: 'Multi-Region Support',
              key: 'multi_region',
              category: 'geography',
              description: 'Support for multiple geographical regions',
              rolloutPercentage: 100,
            },
          ]
        : []),

      // Pricing
      ...(categories.includes('pricing')
        ? [
            {
              name: 'Dynamic Pricing',
              key: 'dynamic_pricing',
              category: 'pricing',
              description: 'Real-time dynamic pricing based on demand',
              rolloutPercentage: 60,
            },
            {
              name: 'Surge Pricing Alerts',
              key: 'surge_alerts',
              category: 'pricing',
              description: 'Alerts for surge pricing periods',
              userRoles: ['user'],
            },
            {
              name: 'Loyalty Discounts',
              key: 'loyalty_discounts',
              category: 'pricing',
              description: 'Discounts for loyal customers',
              userRoles: ['premium_user'],
            },
          ]
        : []),

      // System
      ...(categories.includes('system')
        ? [
            {
              name: 'API Rate Limiting',
              key: 'api_rate_limiting',
              category: 'system',
              description: 'Advanced API rate limiting',
              rolloutPercentage: 100,
            },
            {
              name: 'Caching Layer',
              key: 'caching_layer',
              category: 'system',
              description: 'Enhanced caching for better performance',
              environments: ['staging', 'prod'],
            },
            {
              name: 'Feature Flags System',
              key: 'feature_flags_system',
              category: 'system',
              description: 'Enable feature flags management',
              userRoles: ['admin'],
              autoEnable: true,
            },
          ]
        : []),
    ];

    const createdFlags: any[] = [];
    const errors: string[] = [];

    for (const flagData of standardFlags) {
      try {
        // Check if flag already exists
        const existing = await this.prisma.featureFlag.findUnique({
          where: { key: flagData.key },
        });

        if (!existing) {
          const flag = await this.create(
            flagData as CreateFeatureFlagDto,
            createdBy,
          );
          createdFlags.push(flag);
        } else {
          errors.push(`Flag "${flagData.key}" already exists`);
        }
      } catch (error) {
        errors.push(
          `Failed to create "${flagData.key}": ${(error as Error).message}`,
        );
      }
    }

    return {
      message: 'Standard feature flags creation completed',
      created: createdFlags.length,
      errors: errors.length,
      flags: createdFlags,
      errorMessages: errors,
    };
  }

  async bulkUpdate(updateDto: BulkFeatureFlagUpdateDto, updatedBy?: string) {
    const { flagIds, updates } = updateDto;

    if (!Array.isArray(flagIds) || flagIds.length === 0) {
      throw new BadRequestException('flagIds must be a non-empty array');
    }

    const results: Array<{
      flagId: number;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];
    for (const flagId of flagIds) {
      try {
        const flag = await this.update(
          flagId,
          updates as UpdateFeatureFlagDto,
          updatedBy,
        );
        results.push({ flagId, success: true, data: flag });
      } catch (error) {
        results.push({
          flagId,
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

  private checkUserTargeting(
    flag: any,
    userId?: number,
    userRole?: string,
  ): boolean {
    // If no targeting specified, all users are targeted
    if (!flag.userRoles && !flag.userIds) {
      return true;
    }

    // Check specific user IDs
    if (flag.userIds && userId && flag.userIds.includes(userId)) {
      return true;
    }

    // Check user roles
    if (flag.userRoles && userRole && flag.userRoles.includes(userRole)) {
      return true;
    }

    return false;
  }

  private checkEnvironmentTargeting(flag: any, environment?: string): boolean {
    // If no environments specified, all environments are targeted
    if (!flag.environments || flag.environments.length === 0) {
      return true;
    }

    return environment ? flag.environments.includes(environment) : false;
  }

  private hashUserId(userId: number): number {
    // Simple hash function to distribute users consistently
    const hash = createHash('md5').update(userId.toString()).digest('hex');
    return parseInt(hash.substring(0, 8), 16) % 100;
  }

  private transformFlag(flag: any) {
    return {
      ...flag,
      rolloutPercentage: Number(flag.rolloutPercentage || 100),
      userRoles: this.transformJsonArrayToStringArray(flag.userRoles),
      userIds: this.transformJsonArrayToNumberArray(flag.userIds),
      environments: this.transformJsonArrayToStringArray(flag.environments),
    };
  }

  private transformJsonArrayToStringArray(value: any): string[] | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    return undefined;
  }

  private transformJsonArrayToNumberArray(value: any): number[] | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter((item) => !isNaN(item));
    }
    return undefined;
  }
}
