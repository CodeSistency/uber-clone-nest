import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateRideTierDto,
  UpdateRideTierDto,
  RideTierListQueryDto,
  PricingCalculationDto,
  PricingValidationDto,
  PricingValidationResultDto,
} from '../dtos/ride-tier.dto';

@Injectable()
export class RideTiersService {
  private readonly logger = new Logger(RideTiersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createRideTierDto: CreateRideTierDto) {
    // Check for unique name
    const existingTier = await this.prisma.rideTier.findFirst({
      where: { name: createRideTierDto.name },
    });

    if (existingTier) {
      throw new ConflictException(
        `Ride tier with name "${createRideTierDto.name}" already exists`,
      );
    }

    // Validate pricing configuration
    const validation =
      await this.validatePricingConfiguration(createRideTierDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Invalid pricing configuration',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const tier = await this.prisma.rideTier.create({
      data: {
        name: createRideTierDto.name,
        baseFare: createRideTierDto.baseFare,
        perMinuteRate: createRideTierDto.perMinuteRate,
        perMileRate: createRideTierDto.perMileRate,
        imageUrl: createRideTierDto.imageUrl,
        tierMultiplier: createRideTierDto.tierMultiplier || 1.0,
        surgeMultiplier: createRideTierDto.surgeMultiplier || 1.0,
        demandMultiplier: createRideTierDto.demandMultiplier || 1.0,
        luxuryMultiplier: createRideTierDto.luxuryMultiplier || 1.0,
        comfortMultiplier: createRideTierDto.comfortMultiplier || 1.0,
        minPassengers: createRideTierDto.minPassengers || 1,
        maxPassengers: createRideTierDto.maxPassengers || 4,
        isActive: createRideTierDto.isActive ?? true,
        priority: createRideTierDto.priority || 1,
      },
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
        vehicleTypes: {
          include: {
            vehicleType: true,
          },
        },
      },
    });

    this.logger.log(
      `Ride tier created: ${tier.name} (${tier.baseFare}¢ base fare)`,
    );

    return this.transformRideTier(tier);
  }

  async findAll(query: RideTierListQueryDto) {
    const {
      search,
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
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const total = await this.prisma.rideTier.count({ where });

    const tiers = await this.prisma.rideTier.findMany({
      where,
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
        vehicleTypes: {
          include: {
            vehicleType: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      tiers: tiers.map((tier) => this.transformRideTier(tier)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const tier = await this.prisma.rideTier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
        vehicleTypes: {
          include: {
            vehicleType: true,
          },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException(`Ride tier with ID ${id} not found`);
    }

    return this.transformRideTier(tier);
  }

  async update(id: number, updateRideTierDto: UpdateRideTierDto) {
    // Check if tier exists
    const existingTier = await this.prisma.rideTier.findUnique({
      where: { id },
    });

    if (!existingTier) {
      throw new NotFoundException(`Ride tier with ID ${id} not found`);
    }

    // Check unique name constraint only if name is being changed
    if (
      updateRideTierDto.name &&
      updateRideTierDto.name !== existingTier.name
    ) {
      const existingByName = await this.prisma.rideTier.findFirst({
        where: { name: updateRideTierDto.name },
      });

      if (existingByName) {
        throw new ConflictException(
          `Ride tier with name "${updateRideTierDto.name}" already exists`,
        );
      }
    }

    // Validate pricing configuration
    const validation = await this.validatePricingConfiguration(
      updateRideTierDto,
      id,
    );
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Invalid pricing configuration',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const updatedTier = await this.prisma.rideTier.update({
      where: { id },
      data: {
        name: updateRideTierDto.name,
        baseFare: updateRideTierDto.baseFare,
        perMinuteRate: updateRideTierDto.perMinuteRate,
        perMileRate: updateRideTierDto.perMileRate,
        imageUrl: updateRideTierDto.imageUrl,
        tierMultiplier: updateRideTierDto.tierMultiplier,
        surgeMultiplier: updateRideTierDto.surgeMultiplier,
        demandMultiplier: updateRideTierDto.demandMultiplier,
        luxuryMultiplier: updateRideTierDto.luxuryMultiplier,
        comfortMultiplier: updateRideTierDto.comfortMultiplier,
        minPassengers: updateRideTierDto.minPassengers,
        maxPassengers: updateRideTierDto.maxPassengers,
        isActive: updateRideTierDto.isActive,
        priority: updateRideTierDto.priority,
      },
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
        vehicleTypes: {
          include: {
            vehicleType: true,
          },
        },
      },
    });

    this.logger.log(`Ride tier updated: ${updatedTier.name}`);

    return this.transformRideTier(updatedTier);
  }

  async remove(id: number) {
    // Check if tier exists
    const tier = await this.prisma.rideTier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException(`Ride tier with ID ${id} not found`);
    }

    // Check if tier is being used by active rides
    if (tier._count.rides > 0) {
      throw new ConflictException(
        `Cannot delete ride tier "${tier.name}" because it has ${tier._count.rides} associated rides`,
      );
    }

    await this.prisma.rideTier.delete({
      where: { id },
    });

    this.logger.log(`Ride tier deleted: ${tier.name}`);

    return { message: 'Ride tier deleted successfully' };
  }

  async calculatePricing(calculationDto: PricingCalculationDto) {
    const {
      tierId,
      distance,
      duration,
      countryId,
      stateId,
      cityId,
      zoneId,
      surgeMultiplier = 1.0,
    } = calculationDto;

    // Get tier
    const tier = await this.prisma.rideTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new NotFoundException(`Ride tier with ID ${tierId} not found`);
    }

    // Calculate base pricing
    const baseFare = Number(tier.baseFare);
    const distanceCost = distance * Number(tier.perMileRate);
    const timeCost = duration * Number(tier.perMinuteRate);
    const subtotal = baseFare + distanceCost + timeCost;

    // Apply tier-specific multipliers
    const tierAdjustedTotal = subtotal * Number(tier.tierMultiplier);

    // Get regional multipliers
    const regionalMultipliers = await this.getRegionalMultipliers(
      countryId,
      stateId,
      cityId,
      zoneId,
    );

    // Calculate regional adjustments
    const regionalTotal =
      tierAdjustedTotal * regionalMultipliers.totalMultiplier;

    // Apply dynamic pricing
    const zone = zoneId
      ? await this.prisma.serviceZone.findUnique({
          where: { id: zoneId },
          select: { demandMultiplier: true },
        })
      : null;

    const demandMultiplier = zone ? Number(zone.demandMultiplier) : 1.0;
    const totalDynamicMultiplier = surgeMultiplier * demandMultiplier;

    const dynamicTotal = regionalTotal * totalDynamicMultiplier;

    // Calculate service fees and taxes (simplified)
    const serviceFees = Math.round(dynamicTotal * 0.1); // 10% service fee
    const taxes = Math.round(dynamicTotal * 0.08); // 8% tax

    const totalAmount = dynamicTotal + serviceFees + taxes;

    return {
      tier: {
        id: tier.id,
        name: tier.name,
        baseFare: Number(tier.baseFare),
        perMinuteRate: Number(tier.perMinuteRate),
        perMileRate: Number(tier.perMileRate),
        tierMultiplier: Number(tier.tierMultiplier),
        surgeMultiplier: Number(tier.surgeMultiplier),
        demandMultiplier: Number(tier.demandMultiplier),
        luxuryMultiplier: Number(tier.luxuryMultiplier),
        comfortMultiplier: Number(tier.comfortMultiplier),
      },
      basePricing: {
        baseFare,
        distanceCost,
        timeCost,
        subtotal,
        tierAdjustedTotal,
      },
      regionalMultipliers: {
        countryMultiplier: regionalMultipliers.country,
        stateMultiplier: regionalMultipliers.state,
        cityMultiplier: regionalMultipliers.city,
        zoneMultiplier: regionalMultipliers.zone,
        totalMultiplier: regionalMultipliers.totalMultiplier,
      },
      dynamicPricing: {
        surgeMultiplier,
        demandMultiplier,
        totalDynamicMultiplier,
      },
      finalPricing: {
        baseAmount: regionalTotal,
        regionalAdjustments: regionalTotal - subtotal,
        dynamicAdjustments: dynamicTotal - regionalTotal,
        serviceFees,
        taxes,
        totalAmount,
      },
      metadata: {
        currency: 'USD',
        distanceUnit: 'miles',
        calculationTimestamp: new Date(),
        appliedRules: this.getAppliedRules(
          regionalMultipliers,
          surgeMultiplier,
          demandMultiplier,
        ),
      },
    };
  }

  async validatePricingConfiguration(
    pricingDto: CreateRideTierDto | UpdateRideTierDto,
    compareWithTierId?: number,
  ): Promise<PricingValidationResultDto> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { baseFare, perMinuteRate, perMileRate } = pricingDto;

    // Basic validation rules
    if (baseFare < 50) {
      errors.push('Base fare must be at least 50 cents');
    }

    if (baseFare > 5000) {
      errors.push('Base fare cannot exceed 5000 cents ($50)');
    }

    if (perMinuteRate < 5) {
      errors.push('Per minute rate must be at least 5 cents');
    }

    if (perMinuteRate > 200) {
      errors.push('Per minute rate cannot exceed 200 cents');
    }

    if (perMileRate < 20) {
      errors.push('Per mile rate must be at least 20 cents');
    }

    if (perMileRate > 500) {
      errors.push('Per mile rate cannot exceed 500 cents');
    }

    // Business logic validations
    const totalForTypicalRide = baseFare + 15 * perMinuteRate + 5 * perMileRate; // 15 min, 5 miles

    if (totalForTypicalRide < 500) {
      warnings.push(
        'Total for typical ride seems too low, may not be profitable',
      );
    }

    if (totalForTypicalRide > 3000) {
      warnings.push('Total for typical ride seems too high, may reduce demand');
    }

    // Competitiveness analysis
    let comparison: any = undefined;
    if (compareWithTierId) {
      const existingTier = await this.prisma.rideTier.findUnique({
        where: { id: compareWithTierId },
      });

      if (existingTier) {
        const existingTotal =
          Number(existingTier.baseFare) +
          15 * Number(existingTier.perMinuteRate) +
          5 * Number(existingTier.perMileRate);

        const newTotal = baseFare + 15 * perMinuteRate + 5 * perMileRate;
        const difference = newTotal - existingTotal;

        comparison = {
          existingTier: {
            id: existingTier.id,
            name: existingTier.name,
            baseFare: Number(existingTier.baseFare),
            perMinuteRate: Number(existingTier.perMinuteRate),
            perMileRate: Number(existingTier.perMileRate),
          },
          differences: {
            baseFare: baseFare - Number(existingTier.baseFare),
            perMinuteRate: perMinuteRate - Number(existingTier.perMinuteRate),
            perMileRate: perMileRate - Number(existingTier.perMileRate),
          },
          competitiveness:
            Math.abs(difference) < 100
              ? 'similar'
              : difference > 0
                ? 'more_expensive'
                : ('more_competitive' as const),
        };
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      comparison,
    };
  }

  async createStandardTiers() {
    const standardTiers = [
      {
        name: 'UberX',
        baseFare: 250, // $2.50
        perMinuteRate: 15, // $0.15/min
        perMileRate: 120, // $1.20/mile
        tierMultiplier: 1.0, // Economy
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        priority: 10,
      },
      {
        name: 'UberXL',
        baseFare: 350, // $3.50
        perMinuteRate: 20, // $0.20/min
        perMileRate: 150, // $1.50/mile
        tierMultiplier: 1.3, // Comfort
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.2,
        minPassengers: 1,
        maxPassengers: 6,
        priority: 9,
      },
      {
        name: 'Comfort',
        baseFare: 400, // $4.00
        perMinuteRate: 25, // $0.25/min
        perMileRate: 180, // $1.80/mile
        tierMultiplier: 1.8, // Premium
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.5,
        minPassengers: 1,
        maxPassengers: 4,
        priority: 8,
      },
      {
        name: 'Uber Black',
        baseFare: 800, // $8.00
        perMinuteRate: 40, // $0.40/min
        perMileRate: 350, // $3.50/mile
        tierMultiplier: 2.5, // Luxury
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.8,
        comfortMultiplier: 2.0,
        minPassengers: 1,
        maxPassengers: 4,
        priority: 7,
      },
    ];

    const createdTiers: any[] = [];
    const errors: string[] = [];

    for (const tierData of standardTiers) {
      try {
        // Check if tier already exists
        const existing = await this.prisma.rideTier.findFirst({
          where: { name: tierData.name },
        });

        if (!existing) {
          const tier = await this.create({
            ...tierData,
            baseFare: tierData.baseFare,
            perMinuteRate: tierData.perMinuteRate,
            perMileRate: tierData.perMileRate,
          } as CreateRideTierDto);
          createdTiers.push(tier);
        } else {
          errors.push(`Tier "${tierData.name}" already exists`);
        }
      } catch (error) {
        errors.push(
          `Failed to create "${tierData.name}": ${(error as Error).message}`,
        );
      }
    }

    return {
      message: 'Standard tiers creation completed',
      created: createdTiers.length,
      errors: errors.length,
      tiers: createdTiers,
      errorMessages: errors,
    };
  }

  async getPricingSummary() {
    const tiers = await this.prisma.rideTier.findMany({
      include: {
        _count: {
          select: {
            rides: true,
          },
        },
      },
    });

    const summary = {
      totalTiers: tiers.length,
      activeTiers: tiers.filter((t) => t.isActive).length,
      totalRides: tiers.reduce((sum, tier) => sum + tier._count.rides, 0),
      averageBaseFare:
        tiers.length > 0
          ? tiers.reduce((sum, tier) => sum + Number(tier.baseFare), 0) /
            tiers.length
          : 0,
      priceRanges: {
        lowest:
          tiers.length > 0
            ? Math.min(...tiers.map((t) => Number(t.baseFare)))
            : 0,
        highest:
          tiers.length > 0
            ? Math.max(...tiers.map((t) => Number(t.baseFare)))
            : 0,
      },
      tierDistribution: {
        economy: tiers.filter((t) => Number(t.tierMultiplier) <= 1.2).length,
        comfort: tiers.filter(
          (t) =>
            Number(t.tierMultiplier) > 1.2 && Number(t.tierMultiplier) <= 1.8,
        ).length,
        premium: tiers.filter(
          (t) =>
            Number(t.tierMultiplier) > 1.8 && Number(t.tierMultiplier) <= 2.5,
        ).length,
        luxury: tiers.filter((t) => Number(t.tierMultiplier) > 2.5).length,
      },
      tiers: tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        baseFare: Number(tier.baseFare),
        tierMultiplier: Number(tier.tierMultiplier),
        ridesCount: tier._count.rides,
        isActive: tier.isActive,
      })),
    };

    return summary;
  }

  private async getRegionalMultipliers(
    countryId?: number,
    stateId?: number,
    cityId?: number,
    zoneId?: number,
  ) {
    let countryMultiplier = 1.0;
    let stateMultiplier = 1.0;
    let cityMultiplier = 1.0;
    let zoneMultiplier = 1.0;

    // Get country multiplier
    if (countryId) {
      const country = await this.prisma.country.findUnique({
        where: { id: countryId },
        select: { pricingMultiplier: true },
      });
      if (country?.pricingMultiplier) {
        countryMultiplier = Number(country.pricingMultiplier);
      }
    }

    // Get state multiplier
    if (stateId) {
      const state = await this.prisma.state.findUnique({
        where: { id: stateId },
        select: { pricingMultiplier: true },
      });
      if (state?.pricingMultiplier) {
        stateMultiplier = Number(state.pricingMultiplier);
      }
    }

    // Get city multiplier
    if (cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
        select: { pricingMultiplier: true },
      });
      if (city?.pricingMultiplier) {
        cityMultiplier = Number(city.pricingMultiplier);
      }
    }

    // Get zone multiplier
    if (zoneId) {
      const zone = await this.prisma.serviceZone.findUnique({
        where: { id: zoneId },
        select: { pricingMultiplier: true },
      });
      if (zone?.pricingMultiplier) {
        zoneMultiplier = Number(zone.pricingMultiplier);
      }
    }

    const totalMultiplier =
      countryMultiplier * stateMultiplier * cityMultiplier * zoneMultiplier;

    return {
      country: countryMultiplier,
      state: stateMultiplier,
      city: cityMultiplier,
      zone: zoneMultiplier,
      totalMultiplier,
    };
  }

  private getAppliedRules(
    regionalMultipliers: any,
    surgeMultiplier: number,
    demandMultiplier: number,
  ): string[] {
    const rules: string[] = [];

    if (regionalMultipliers.country !== 1.0) {
      rules.push('country_pricing_multiplier');
    }
    if (regionalMultipliers.state !== 1.0) {
      rules.push('state_pricing_multiplier');
    }
    if (regionalMultipliers.city !== 1.0) {
      rules.push('city_pricing_multiplier');
    }
    if (regionalMultipliers.zone !== 1.0) {
      rules.push('zone_pricing_multiplier');
    }
    if (surgeMultiplier !== 1.0) {
      rules.push('surge_pricing');
    }
    if (demandMultiplier !== 1.0) {
      rules.push('demand_pricing');
    }

    return rules;
  }

  private transformRideTier(tier: any) {
    return {
      ...tier,
      baseFare: Number(tier.baseFare),
      perMinuteRate: Number(tier.perMinuteRate),
      perMileRate: Number(tier.perMileRate),
      tierMultiplier: Number(tier.tierMultiplier),
      surgeMultiplier: Number(tier.surgeMultiplier),
      demandMultiplier: Number(tier.demandMultiplier),
      luxuryMultiplier: Number(tier.luxuryMultiplier),
      comfortMultiplier: Number(tier.comfortMultiplier),
      minPassengers: tier.minPassengers,
      maxPassengers: tier.maxPassengers,
      isActive: tier.isActive,
      priority: tier.priority,
      ridesCount: tier._count?.rides || 0,
      vehicleTypes:
        tier.vehicleTypes?.map((vt: any) => vt.vehicleType.name) || [],
      _count: undefined,
    };
  }
}
