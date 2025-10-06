import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RideTiersService } from './ride-tiers.service';
import { PrismaService } from '../../../../../src/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { jest } from '@jest/globals';
import {
  CreateRideTierDto,
  UpdateRideTierDto,
  PricingCalculationDto,
} from '../dtos/ride-tier.dto';
import {
  setupUnitTestModule,
  testUtils,
  mockPrismaService,
} from '../../../../../test/setup/unit-setup';

describe('RideTiersService', () => {
  let service: RideTiersService;

  beforeEach(async () => {
    const module: TestingModule = await setupUnitTestModule({
      providers: [RideTiersService],
    });

    service = module.get<RideTiersService>(RideTiersService);

    testUtils.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ride tier successfully', async () => {
      const createDto: CreateRideTierDto = {
        name: 'UberX',
        baseFare: 250,
        perMinuteRate: 15,
        perKmRate: 120,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
      };

      const expectedResult = {
        id: 1,
        name: 'UberX',
        baseFare: 250,
        perMinuteRate: 15,
        perKmRate: 120,
        imageUrl: null,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ridesCount: 0,
        vehicleTypes: [],
        _count: undefined,
      };

      mockPrismaService.rideTier.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(mockPrismaService.rideTier.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          baseFare: createDto.baseFare,
          perMinuteRate: createDto.perMinuteRate,
          perKmRate: createDto.perKmRate,
          tierMultiplier: createDto.tierMultiplier,
          surgeMultiplier: createDto.surgeMultiplier,
          demandMultiplier: createDto.demandMultiplier,
          luxuryMultiplier: createDto.luxuryMultiplier,
          comfortMultiplier: createDto.comfortMultiplier,
          minPassengers: createDto.minPassengers,
          maxPassengers: createDto.maxPassengers,
          isActive: createDto.isActive,
          priority: createDto.priority,
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
      expect(result).toEqual(expectedResult);
    });

    it('should create tier with default values', async () => {
      const createDto: CreateRideTierDto = {
        name: 'UberXL',
        baseFare: 400,
        perMinuteRate: 20,
        perKmRate: 150,
      };

      const expectedResult = {
        id: 2,
        name: 'UberXL',
        baseFare: 400,
        perMinuteRate: 20,
        perKmRate: 150,
        imageUrl: null,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ridesCount: 0,
        vehicleTypes: [],
        _count: undefined,
      };

      mockPrismaService.rideTier.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(result.tierMultiplier).toBe(1.0);
      expect(result.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated ride tiers', async () => {
      const mockTiers = [
        {
          id: 1,
          name: 'UberX',
          baseFare: 250,
          perMinuteRate: 15,
          perKmRate: 120,
          imageUrl: null,
          tierMultiplier: 1.0,
          surgeMultiplier: 1.0,
          demandMultiplier: 1.0,
          luxuryMultiplier: 1.0,
          comfortMultiplier: 1.0,
          minPassengers: 1,
          maxPassengers: 4,
          isActive: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ridesCount: 0,
          vehicleTypes: [],
          _count: undefined,
        },
        {
          id: 2,
          name: 'UberXL',
          baseFare: 400,
          perMinuteRate: 20,
          perKmRate: 150,
          imageUrl: null,
          tierMultiplier: 1.0,
          surgeMultiplier: 1.0,
          demandMultiplier: 1.0,
          luxuryMultiplier: 1.0,
          comfortMultiplier: 1.0,
          minPassengers: 1,
          maxPassengers: 6,
          isActive: true,
          priority: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          ridesCount: 0,
          vehicleTypes: [],
          _count: undefined,
        },
      ];

      mockPrismaService.rideTier.findMany.mockResolvedValue(mockTiers);
      mockPrismaService.rideTier.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.tiers).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by active status', async () => {
      const mockTiers = [
        {
          id: 1,
          name: 'UberX',
          baseFare: 250,
          perMinuteRate: 15,
          perKmRate: 120,
          imageUrl: null,
          tierMultiplier: 1.0,
          surgeMultiplier: 1.0,
          demandMultiplier: 1.0,
          luxuryMultiplier: 1.0,
          comfortMultiplier: 1.0,
          minPassengers: 1,
          maxPassengers: 4,
          isActive: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ridesCount: 0,
          vehicleTypes: [],
          _count: undefined,
        },
      ];

      mockPrismaService.rideTier.findMany.mockResolvedValue(mockTiers);
      mockPrismaService.rideTier.count.mockResolvedValue(1);

      const result = await service.findAll({ isActive: true });

      expect(mockPrismaService.rideTier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
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
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a ride tier by id', async () => {
      const mockTier = {
        id: 1,
        name: 'UberX',
        baseFare: 250,
        perMinuteRate: 15,
        perKmRate: 120,
        imageUrl: null,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ridesCount: 0,
        vehicleTypes: [],
        _count: undefined,
      };

      mockPrismaService.rideTier.findUnique.mockResolvedValue(mockTier);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTier);
      expect(mockPrismaService.rideTier.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
    });

    it('should throw NotFoundException for non-existent tier', async () => {
      mockPrismaService.rideTier.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a ride tier successfully', async () => {
      const updateDto: UpdateRideTierDto = {
        name: 'UberX Premium',
        baseFare: 300,
        perMinuteRate: 20,
        perKmRate: 130,
      };

      const existingTier = {
        id: 1,
        name: 'UberX',
        baseFare: 250,
        perMinuteRate: 15,
        perKmRate: 120,
        imageUrl: null,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTier = {
        id: 1,
        name: 'UberX Premium',
        baseFare: 300,
        perMinuteRate: 20,
        perKmRate: 130,
        imageUrl: null,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ridesCount: 0,
        vehicleTypes: [],
        _count: undefined,
      };

      mockPrismaService.rideTier.findUnique.mockResolvedValue(existingTier);
      mockPrismaService.rideTier.update.mockResolvedValue(updatedTier);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedTier);
    });

    it('should throw NotFoundException when updating non-existent tier', async () => {
      mockPrismaService.rideTier.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          name: 'Test',
          baseFare: 100,
          perMinuteRate: 10,
          perKmRate: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculatePricing', () => {
    it('should calculate pricing correctly', async () => {
      const calculationDto: PricingCalculationDto = {
        tierId: 1,
        distance: 10,
        duration: 20,
        countryId: 1,
        stateId: 1,
        cityId: 1,
        zoneId: 1,
        surgeMultiplier: 1.2,
      };

      const mockTier = {
        id: 1,
        name: 'UberX',
        baseFare: new Decimal(250),
        perMinuteRate: new Decimal(15),
        perKmRate: new Decimal(120),
        imageUrl: null,
        tierMultiplier: new Decimal(1.0),
        surgeMultiplier: new Decimal(1.0),
        demandMultiplier: new Decimal(1.0),
        luxuryMultiplier: new Decimal(1.0),
        comfortMultiplier: new Decimal(1.0),
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.rideTier.findUnique.mockResolvedValue(mockTier);

      // Mock getRegionalMultipliers
      jest.spyOn(service as any, 'getRegionalMultipliers').mockResolvedValue({
        country: 1.0,
        state: 1.0,
        city: 1.0,
        zone: 1.0,
        totalMultiplier: 1.0,
      });

      const result = await service.calculatePricing(calculationDto);

      expect(result.tier.id).toBe(1);
      expect(result.tier.name).toBe('UberX');
      expect(result.basePricing.baseFare).toBe(250);
      expect(result.basePricing.distanceCost).toBe(1200); // 10 km * 120 cents/km
      expect(result.basePricing.timeCost).toBe(300); // 20 min * 15
      expect(result.basePricing.subtotal).toBe(1750); // 250 + 1200 + 300
    });

    it('should apply regional multipliers', async () => {
      const calculationDto: PricingCalculationDto = {
        tierId: 1,
        distance: 5,
        duration: 10,
      };

      const mockTier = {
        id: 1,
        name: 'UberX',
        baseFare: new Decimal(200),
        perMinuteRate: new Decimal(10),
        perKmRate: new Decimal(100),
        imageUrl: null,
        tierMultiplier: new Decimal(1.0),
        surgeMultiplier: new Decimal(1.0),
        demandMultiplier: new Decimal(1.0),
        luxuryMultiplier: new Decimal(1.0),
        comfortMultiplier: new Decimal(1.0),
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.rideTier.findUnique.mockResolvedValue(mockTier);

      // Mock regional multipliers with 20% increase
      jest.spyOn(service as any, 'getRegionalMultipliers').mockResolvedValue({
        country: 1.1,
        state: 1.05,
        city: 1.02,
        zone: 1.03,
        totalMultiplier: 1.221, // 1.1 * 1.05 * 1.02 * 1.03
      });

      const result = await service.calculatePricing(calculationDto);

      expect(result.regionalMultipliers.totalMultiplier).toBe(1.221);
      expect(result.regionalMultipliers.countryMultiplier).toBe(1.1);
      expect(result.regionalMultipliers.stateMultiplier).toBe(1.05);
    });

    it('should throw NotFoundException for non-existent tier', async () => {
      mockPrismaService.rideTier.findUnique.mockResolvedValue(null);

      const calculationDto: PricingCalculationDto = {
        tierId: 999,
        distance: 5,
        duration: 10,
      };

      await expect(service.calculatePricing(calculationDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getRegionalMultipliers', () => {
    it('should combine all regional multipliers', async () => {
      // Mock database calls
      mockPrismaService.country.findUnique.mockResolvedValue({
        id: 1,
        pricingMultiplier: new Decimal(1.1),
      });
      mockPrismaService.state.findUnique.mockResolvedValue({
        id: 1,
        pricingMultiplier: new Decimal(1.05),
      });
      mockPrismaService.city.findUnique.mockResolvedValue({
        id: 1,
        pricingMultiplier: new Decimal(1.02),
      });
      mockPrismaService.serviceZone.findUnique.mockResolvedValue({
        id: 1,
        pricingMultiplier: new Decimal(1.03),
        demandMultiplier: new Decimal(1.0),
      });

      const result = await (service as any).getRegionalMultipliers(1, 1, 1, 1);

      expect(result.country).toBe(1.1);
      expect(result.state).toBe(1.05);
      expect(result.city).toBe(1.02);
      expect(result.zone).toBe(1.03);
      expect(result.totalMultiplier).toBeCloseTo(1.213, 3); // 1.1 * 1.05 * 1.02 * 1.03
    });

    it('should handle missing regional data', async () => {
      // All regional queries return null
      mockPrismaService.country.findUnique.mockResolvedValue(null);
      mockPrismaService.state.findUnique.mockResolvedValue(null);
      mockPrismaService.city.findUnique.mockResolvedValue(null);
      mockPrismaService.serviceZone.findUnique.mockResolvedValue(null);

      const result = await (service as any).getRegionalMultipliers(1, 1, 1, 1);

      expect(result.country).toBe(1.0);
      expect(result.state).toBe(1.0);
      expect(result.city).toBe(1.0);
      expect(result.zone).toBe(1.0);
      expect(result.totalMultiplier).toBe(1.0);
    });
  });

  describe('createStandardTiers', () => {
    it('should create standard Uber tiers', async () => {
      mockPrismaService.rideTier.create.mockResolvedValue({
        id: 1,
        name: 'UberX',
        baseFare: new Decimal(250),
        perMinuteRate: new Decimal(15),
        perKmRate: new Decimal(120),
        imageUrl: null,
        tierMultiplier: new Decimal(1.0),
        surgeMultiplier: new Decimal(1.0),
        demandMultiplier: new Decimal(1.0),
        luxuryMultiplier: new Decimal(1.0),
        comfortMultiplier: new Decimal(1.0),
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createStandardTiers();

      expect(result.message).toContain('Standard tiers and combinations creation completed');
      expect(result.created).toBeGreaterThan(0);
      expect(mockPrismaService.rideTier.create).toHaveBeenCalled();
    });
  });

  describe('validatePricingConfiguration', () => {
    it('should validate pricing configuration', async () => {
      const mockTier = {
        name: 'UberX',
        baseFare: 250,
        perMinuteRate: 15,
        perKmRate: 120,
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
      };

      const result = await service.validatePricingConfiguration(mockTier);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect pricing issues', async () => {
      const mockTier = {
        name: 'Invalid Tier',
        baseFare: 0, // Invalid: zero base fare
        perMinuteRate: 0, // Invalid: zero per minute
        perKmRate: 0, // Invalid: zero per kilometer
        tierMultiplier: 1.0,
        surgeMultiplier: 1.0,
        demandMultiplier: 1.0,
        luxuryMultiplier: 1.0,
        comfortMultiplier: 1.0,
        minPassengers: 1,
        maxPassengers: 4,
        isActive: true,
        priority: 1,
      };

      const result = await service.validatePricingConfiguration(mockTier);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
