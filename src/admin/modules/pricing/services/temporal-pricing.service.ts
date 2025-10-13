import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateTemporalPricingRuleDto,
  UpdateTemporalPricingRuleDto,
  TemporalPricingRuleListQueryDto,
  TemporalPricingEvaluationDto,
  CreateStandardTemporalRulesDto,
  BulkTemporalRuleUpdateDto,
} from '../dtos/temporal-pricing.dto';

@Injectable()
export class TemporalPricingService {
  private readonly logger = new Logger(TemporalPricingService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTemporalPricingRuleDto) {
    // Check for unique name
    const existingRule = await this.prisma.temporalPricingRule.findFirst({
      where: { name: createDto.name },
    });

    if (existingRule) {
      throw new ConflictException(
        `Temporal pricing rule with name "${createDto.name}" already exists`,
      );
    }

    // Validate rule configuration
    this.validateRuleConfiguration(createDto);

    const rule = await this.prisma.temporalPricingRule.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        ruleType: createDto.ruleType?.toUpperCase() as any,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        daysOfWeek: createDto.daysOfWeek,
        specificDates: createDto.specificDates,
        dateRanges: createDto.dateRanges,
        multiplier: createDto.multiplier,
        priority: createDto.priority || 1,
        countryId: createDto.countryId,
        stateId: createDto.stateId,
        cityId: createDto.cityId,
        zoneId: createDto.zoneId,
        isActive: createDto.isActive ?? true,
        autoApply: createDto.autoApply ?? true,
      },
      include: {
        country: { select: { id: true, name: true, isoCode2: true } },
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
        serviceZone: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Temporal pricing rule created: ${rule.name} (${rule.multiplier}x)`,
    );

    return this.transformRule(rule);
  }

  async findAll(query: TemporalPricingRuleListQueryDto) {
    const {
      search,
      ruleType,
      scope,
      isActive,
      sortBy = 'priority',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Rule type filter
    if (ruleType) {
      where.ruleType = ruleType;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Geographic scope filter
    if (scope) {
      switch (scope) {
        case 'global':
          where.countryId = null;
          where.stateId = null;
          where.cityId = null;
          where.zoneId = null;
          break;
        case 'country':
          where.countryId = { not: null };
          where.stateId = null;
          where.cityId = null;
          where.zoneId = null;
          break;
        case 'state':
          where.stateId = { not: null };
          break;
        case 'city':
          where.cityId = { not: null };
          break;
        case 'zone':
          where.zoneId = { not: null };
          break;
      }
    }

    const total = await this.prisma.temporalPricingRule.count({ where });

    const rules = await this.prisma.temporalPricingRule.findMany({
      where,
      include: {
        country: { select: { id: true, name: true, isoCode2: true } },
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
        serviceZone: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      rules: rules.map((rule) => this.transformRuleListItem(rule)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const rule = await this.prisma.temporalPricingRule.findUnique({
      where: { id },
      include: {
        country: { select: { id: true, name: true, isoCode2: true } },
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
        serviceZone: { select: { id: true, name: true } },
      },
    });

    if (!rule) {
      throw new NotFoundException(
        `Temporal pricing rule with ID ${id} not found`,
      );
    }

    return this.transformRule(rule);
  }

  async update(id: number, updateDto: UpdateTemporalPricingRuleDto) {
    const existingRule = await this.prisma.temporalPricingRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      throw new NotFoundException(
        `Temporal pricing rule with ID ${id} not found`,
      );
    }

    // Check unique name constraint
    if (updateDto.name && updateDto.name !== existingRule.name) {
      const existingByName = await this.prisma.temporalPricingRule.findFirst({
        where: { name: updateDto.name },
      });

      if (existingByName) {
        throw new ConflictException(
          `Temporal pricing rule with name "${updateDto.name}" already exists`,
        );
      }
    }

    // Validate rule configuration
    this.validateRuleConfiguration(updateDto);

    const updatedRule = await this.prisma.temporalPricingRule.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        ruleType: updateDto.ruleType?.toUpperCase() as any,
        startTime: updateDto.startTime,
        endTime: updateDto.endTime,
        daysOfWeek: updateDto.daysOfWeek,
        specificDates: updateDto.specificDates,
        dateRanges: updateDto.dateRanges,
        multiplier: updateDto.multiplier,
        priority: updateDto.priority,
        countryId: updateDto.countryId,
        stateId: updateDto.stateId,
        cityId: updateDto.cityId,
        zoneId: updateDto.zoneId,
        isActive: updateDto.isActive,
        autoApply: updateDto.autoApply,
      },
      include: {
        country: { select: { id: true, name: true, isoCode2: true } },
        state: { select: { id: true, name: true, code: true } },
        city: { select: { id: true, name: true } },
        serviceZone: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Temporal pricing rule updated: ${updatedRule.name}`);

    return this.transformRule(updatedRule);
  }

  async remove(id: number) {
    const rule = await this.prisma.temporalPricingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(
        `Temporal pricing rule with ID ${id} not found`,
      );
    }

    await this.prisma.temporalPricingRule.delete({
      where: { id },
    });

    this.logger.log(`Temporal pricing rule deleted: ${rule.name}`);

    return { message: 'Temporal pricing rule deleted successfully' };
  }

  async evaluateTemporalPricing(evaluationDto: TemporalPricingEvaluationDto) {
    const { dateTime, countryId, stateId, cityId, zoneId } = evaluationDto;

    const date = new Date(dateTime);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const timeString = date.toTimeString().substring(0, 5); // HH:MM format
    const dateString = date.toISOString().substring(0, 10); // YYYY-MM-DD format

    // Find applicable rules
    const applicableRules = await this.findApplicableRules(
      date,
      dayOfWeek,
      timeString,
      dateString,
      countryId,
      stateId,
      cityId,
      zoneId,
    );

    // Sort by priority (highest first)
    applicableRules.sort((a, b) => b.priority - a.priority);

    // Apply highest priority rule
    const appliedRule = applicableRules.length > 0 ? applicableRules[0] : null;

    // Calculate combined multiplier
    const combinedMultiplier = appliedRule
      ? Number(appliedRule.multiplier)
      : 1.0;

    return {
      evaluatedAt: dateTime,
      dayOfWeek,
      time: timeString,
      applicableRules: applicableRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        ruleType: rule.ruleType,
        multiplier: Number(rule.multiplier),
        priority: rule.priority,
      })),
      appliedRule: appliedRule
        ? {
            id: appliedRule.id,
            name: appliedRule.name,
            ruleType: appliedRule.ruleType,
            multiplier: Number(appliedRule.multiplier),
            priority: appliedRule.priority,
          }
        : undefined,
      combinedMultiplier,
      scope: {
        country: countryId ? await this.getCountryName(countryId) : undefined,
        state: stateId ? await this.getStateName(stateId) : undefined,
        city: cityId ? await this.getCityName(cityId) : undefined,
        zone: zoneId ? await this.getZoneName(zoneId) : undefined,
      },
    };
  }

  async evaluateSpecificRules(
    ruleIds: number[],
    context: {
      dateTime: string;
      countryId?: number;
      stateId?: number;
      cityId?: number;
      zoneId?: number;
    },
  ) {
    const { dateTime, countryId, stateId, cityId, zoneId } = context;

    // Get specific rules by IDs
    const rules = await this.prisma.temporalPricingRule.findMany({
      where: {
        id: { in: ruleIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        ruleType: true,
        multiplier: true,
        priority: true,
      },
    });

    if (rules.length === 0) {
      // Return empty evaluation if no rules found
      const date = new Date(dateTime);
      const dayOfWeek = date.getDay();
      const timeString = date.toTimeString().substring(0, 5);

      return {
        evaluatedAt: dateTime,
        dayOfWeek,
        time: timeString,
        applicableRules: [],
        appliedRule: undefined,
        combinedMultiplier: 1.0,
        scope: {
          country: countryId ? await this.getCountryName(countryId) : undefined,
          state: stateId ? await this.getStateName(stateId) : undefined,
          city: cityId ? await this.getCityName(cityId) : undefined,
          zone: zoneId ? await this.getZoneName(zoneId) : undefined,
        },
      };
    }

    // Sort by priority (highest first)
    rules.sort((a, b) => b.priority - a.priority);

    // Apply highest priority rule
    const appliedRule = rules[0];

    // Calculate combined multiplier
    const combinedMultiplier = Number(appliedRule.multiplier);

    const date = new Date(dateTime);
    const dayOfWeek = date.getDay();
    const timeString = date.toTimeString().substring(0, 5);

    return {
      evaluatedAt: dateTime,
      dayOfWeek,
      time: timeString,
      applicableRules: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        ruleType: rule.ruleType,
        multiplier: Number(rule.multiplier),
        priority: rule.priority,
      })),
      appliedRule: {
        id: appliedRule.id,
        name: appliedRule.name,
        ruleType: appliedRule.ruleType,
        multiplier: Number(appliedRule.multiplier),
        priority: appliedRule.priority,
      },
      combinedMultiplier,
      scope: {
        country: countryId ? await this.getCountryName(countryId) : undefined,
        state: stateId ? await this.getStateName(stateId) : undefined,
        city: cityId ? await this.getCityName(cityId) : undefined,
        zone: zoneId ? await this.getZoneName(zoneId) : undefined,
      },
    };
  }

  async createStandardRules(standardDto: CreateStandardTemporalRulesDto) {
    const { countryId, stateId, cityId } = standardDto;

    const standardRules = [
      {
        name: 'Morning Peak Hours',
        description: 'Surge pricing during morning rush hour',
        ruleType: 'time_range' as const,
        startTime: '07:00',
        endTime: '09:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        multiplier: 1.4,
        priority: 20,
        countryId,
        stateId,
        cityId,
      },
      {
        name: 'Evening Peak Hours',
        description: 'Surge pricing during evening rush hour',
        ruleType: 'time_range' as const,
        startTime: '17:00',
        endTime: '19:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        multiplier: 1.6,
        priority: 19,
        countryId,
        stateId,
        cityId,
      },
      {
        name: 'Late Night Hours',
        description: 'Higher pricing during late night',
        ruleType: 'time_range' as const,
        startTime: '22:00',
        endTime: '06:00',
        multiplier: 1.6,
        priority: 15,
        countryId,
        stateId,
        cityId,
      },
      {
        name: 'Weekend Surcharge',
        description: 'Additional pricing on weekends',
        ruleType: 'day_of_week' as const,
        daysOfWeek: [0, 6], // Saturday and Sunday
        multiplier: 1.2,
        priority: 10,
        countryId,
        stateId,
        cityId,
      },
    ];

    const createdRules: any[] = [];
    const errors: string[] = [];

    for (const ruleData of standardRules) {
      try {
        // Check if rule already exists for this scope
        const existing = await this.prisma.temporalPricingRule.findFirst({
          where: {
            name: ruleData.name,
            countryId: ruleData.countryId,
            stateId: ruleData.stateId,
            cityId: ruleData.cityId,
          },
        });

        if (!existing) {
          const rule = await this.create(
            ruleData as CreateTemporalPricingRuleDto,
          );
          createdRules.push(rule);
        } else {
          errors.push(
            `Rule "${(ruleData as any).name}" already exists for this scope`,
          );
        }
      } catch (error) {
        errors.push(
          `Failed to create "${(ruleData as any).name}": ${(error as Error).message}`,
        );
      }
    }

    return {
      message: 'Standard temporal pricing rules creation completed',
      created: createdRules.length,
      errors: errors.length,
      rules: createdRules,
      errorMessages: errors,
    };
  }

  async bulkUpdate(updateDto: BulkTemporalRuleUpdateDto) {
    const { ruleIds, updates } = updateDto;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new BadRequestException('ruleIds must be a non-empty array');
    }

    const results: Array<{
      ruleId: number;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];
    for (const ruleId of ruleIds) {
      try {
        const rule = await this.update(
          ruleId,
          updates as UpdateTemporalPricingRuleDto,
        );
        results.push({ ruleId, success: true, data: rule });
      } catch (error) {
        results.push({
          ruleId,
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

  private async findApplicableRules(
    date: Date,
    dayOfWeek: number,
    timeString: string,
    dateString: string,
    countryId?: number,
    stateId?: number,
    cityId?: number,
    zoneId?: number,
  ) {
    const rules = await this.prisma.temporalPricingRule.findMany({
      where: {
        isActive: true,
        autoApply: true,
        OR: [
          // Global rules
          {
            countryId: null,
            stateId: null,
            cityId: null,
            zoneId: null,
          },
          // Country-specific rules
          countryId ? { countryId } : {},
          // State-specific rules
          stateId ? { stateId } : {},
          // City-specific rules
          cityId ? { cityId } : {},
          // Zone-specific rules
          zoneId ? { zoneId } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
    });

    // Filter rules that apply to current date/time
    return rules.filter((rule) =>
      this.ruleAppliesToDateTime(rule, date, dayOfWeek, timeString, dateString),
    );
  }

  private ruleAppliesToDateTime(
    rule: any,
    date: Date,
    dayOfWeek: number,
    timeString: string,
    dateString: string,
  ): boolean {
    switch (rule.ruleType) {
      case 'time_range':
        return (
          this.checkTimeRange(rule, timeString) &&
          this.checkDaysOfWeek(rule, dayOfWeek)
        );

      case 'day_of_week':
        return this.checkDaysOfWeek(rule, dayOfWeek);

      case 'date_specific':
        return this.checkSpecificDates(rule, dateString);

      case 'seasonal':
        return this.checkDateRanges(rule, dateString);

      default:
        return false;
    }
  }

  private checkTimeRange(rule: any, timeString: string): boolean {
    if (!rule.startTime || !rule.endTime) return true;

    // Handle overnight ranges (e.g., 22:00 - 06:00)
    const startTime = rule.startTime;
    const endTime = rule.endTime;

    if (startTime > endTime) {
      // Overnight range
      return timeString >= startTime || timeString <= endTime;
    } else {
      // Normal range
      return timeString >= startTime && timeString <= endTime;
    }
  }

  private checkDaysOfWeek(rule: any, dayOfWeek: number): boolean {
    if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) return true;
    return rule.daysOfWeek.includes(dayOfWeek);
  }

  private checkSpecificDates(rule: any, dateString: string): boolean {
    if (!rule.specificDates || rule.specificDates.length === 0) return true;
    return rule.specificDates.includes(dateString);
  }

  private checkDateRanges(rule: any, dateString: string): boolean {
    if (!rule.dateRanges || rule.dateRanges.length === 0) return true;

    return rule.dateRanges.some((range: any) => {
      return dateString >= range.start && dateString <= range.end;
    });
  }

  private validateRuleConfiguration(
    dto: CreateTemporalPricingRuleDto | UpdateTemporalPricingRuleDto,
  ) {
    const {
      ruleType,
      startTime,
      endTime,
      daysOfWeek,
      specificDates,
      dateRanges,
      multiplier,
    } = dto;

    // Validate multiplier range
    if (multiplier < 0.5 || multiplier > 10.0) {
      throw new BadRequestException('Multiplier must be between 0.5 and 10.0');
    }

    // Validate time range rules
    if (ruleType === 'time_range') {
      if (!startTime || !endTime) {
        throw new BadRequestException(
          'Time range rules must specify startTime and endTime',
        );
      }
    }

    // Validate date-specific rules
    if (ruleType === 'date_specific') {
      if (!specificDates || specificDates.length === 0) {
        throw new BadRequestException(
          'Date-specific rules must specify specificDates',
        );
      }
    }

    // Validate seasonal rules
    if (ruleType === 'seasonal') {
      if (!dateRanges || dateRanges.length === 0) {
        throw new BadRequestException('Seasonal rules must specify dateRanges');
      }
    }
  }

  private async getCountryName(countryId: number): Promise<string | undefined> {
    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
      select: { name: true },
    });
    return country?.name;
  }

  private async getStateName(stateId: number): Promise<string | undefined> {
    const state = await this.prisma.state.findUnique({
      where: { id: stateId },
      select: { name: true },
    });
    return state?.name;
  }

  private async getCityName(cityId: number): Promise<string | undefined> {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: { name: true },
    });
    return city?.name;
  }

  private async getZoneName(zoneId: number): Promise<string | undefined> {
    const zone = await this.prisma.serviceZone.findUnique({
      where: { id: zoneId },
      select: { name: true },
    });
    return zone?.name;
  }

  async toggleActiveStatus(id: number) {
    const rule = await this.prisma.temporalPricingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(
        `Temporal pricing rule with ID ${id} not found`,
      );
    }

    const updatedRule = await this.prisma.temporalPricingRule.update({
      where: { id },
      data: {
        isActive: !rule.isActive,
      },
    });

    this.logger.log(
      `Temporal pricing rule ${rule.name} status changed to: ${updatedRule.isActive ? 'active' : 'inactive'}`,
    );

    return this.transformRule(updatedRule);
  }

  private transformRule(rule: any) {
    return {
      ...rule,
      multiplier: Number(rule.multiplier),
    };
  }

  private transformRuleListItem(rule: any) {
    let scope = 'Global';
    if (rule.zoneId) {
      scope = `Zona: ${rule.serviceZone?.name || 'N/A'}`;
    } else if (rule.cityId) {
      scope = `Ciudad: ${rule.city?.name || 'N/A'}`;
    } else if (rule.stateId) {
      scope = `Estado: ${rule.state?.name || 'N/A'}`;
    } else if (rule.countryId) {
      scope = `País: ${rule.country?.name || 'N/A'}`;
    }

    return {
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      multiplier: Number(rule.multiplier),
      priority: rule.priority,
      isActive: rule.isActive,
      scope,
    };
  }

  async getRawRulesForSummary() {
    return this.prisma.temporalPricingRule.findMany({
      where: { isActive: true },
      select: {
        id: true,
        ruleType: true,
        multiplier: true,
        countryId: true,
        stateId: true,
        cityId: true,
        zoneId: true,
      },
    });
  }
}
