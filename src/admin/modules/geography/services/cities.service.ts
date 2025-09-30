import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityListQueryDto,
} from '../dtos/country.dto';

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto) {
    // Check if state exists
    const state = await this.prisma.state.findUnique({
      where: { id: createCityDto.stateId },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            isoCode2: true,
          },
        },
      },
    });

    if (!state) {
      throw new NotFoundException(
        `State with ID ${createCityDto.stateId} not found`,
      );
    }

    // Check for unique constraints within the state
    const existingByName = await this.prisma.city.findFirst({
      where: {
        name: createCityDto.name,
        stateId: createCityDto.stateId,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `City with name "${createCityDto.name}" already exists in this state`,
      );
    }

    const city = await this.prisma.city.create({
      data: {
        name: createCityDto.name,
        stateId: createCityDto.stateId,
        latitude: createCityDto.latitude,
        longitude: createCityDto.longitude,
        timezone: createCityDto.timezone,
        isActive: createCityDto.isActive ?? true,
        pricingMultiplier: createCityDto.pricingMultiplier,
        serviceFee: createCityDto.serviceFee,
        serviceRadius: createCityDto.serviceRadius ?? 50,
        boundaries: createCityDto.boundaries,
        restrictedAreas: createCityDto.restrictedAreas,
        premiumZones: createCityDto.premiumZones,
        population: createCityDto.population,
        areaKm2: createCityDto.areaKm2,
        elevation: createCityDto.elevation,
        postalCodes: createCityDto.postalCodes,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: {
                id: true,
                name: true,
                isoCode2: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `City created: ${city.name} in ${state.name}, ${state.country.name}`,
    );

    return this.transformCity(city);
  }

  async findAll(query: CityListQueryDto) {
    const {
      search,
      stateId,
      countryId,
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

    // State filter
    if (stateId) {
      where.stateId = stateId;
    }

    // Country filter (through state relation)
    if (countryId) {
      where.state = {
        countryId: countryId,
      };
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const total = await this.prisma.city.count({ where });

    const cities = await this.prisma.city.findMany({
      where,
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: {
                id: true,
                name: true,
                isoCode2: true,
              },
            },
          },
        },
        _count: {
          select: {
            serviceZones: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      cities: cities.map((city) => this.transformCityWithCount(city)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: {
                id: true,
                name: true,
                isoCode2: true,
              },
            },
          },
        },
        _count: {
          select: {
            serviceZones: true,
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    return this.transformCityWithCount(city);
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    // Check if city exists
    const existingCity = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!existingCity) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    // Check if state exists (if being changed)
    if (
      updateCityDto.stateId &&
      updateCityDto.stateId !== existingCity.stateId
    ) {
      const state = await this.prisma.state.findUnique({
        where: { id: updateCityDto.stateId },
      });

      if (!state) {
        throw new NotFoundException(
          `State with ID ${updateCityDto.stateId} not found`,
        );
      }
    }

    // Check unique constraints only if values are being changed
    const targetStateId = updateCityDto.stateId || existingCity.stateId;

    if (updateCityDto.name && updateCityDto.name !== existingCity.name) {
      const existingByName = await this.prisma.city.findFirst({
        where: {
          name: updateCityDto.name,
          stateId: targetStateId,
        },
      });

      if (existingByName) {
        throw new ConflictException(
          `City with name "${updateCityDto.name}" already exists in this state`,
        );
      }
    }

    const updatedCity = await this.prisma.city.update({
      where: { id },
      data: {
        name: updateCityDto.name,
        stateId: updateCityDto.stateId,
        latitude: updateCityDto.latitude,
        longitude: updateCityDto.longitude,
        timezone: updateCityDto.timezone,
        isActive: updateCityDto.isActive,
        pricingMultiplier: updateCityDto.pricingMultiplier,
        serviceFee: updateCityDto.serviceFee,
        serviceRadius: updateCityDto.serviceRadius,
        boundaries: updateCityDto.boundaries,
        restrictedAreas: updateCityDto.restrictedAreas,
        premiumZones: updateCityDto.premiumZones,
        population: updateCityDto.population,
        areaKm2: updateCityDto.areaKm2,
        elevation: updateCityDto.elevation,
        postalCodes: updateCityDto.postalCodes,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: {
                id: true,
                name: true,
                isoCode2: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`City updated: ${updatedCity.name}`);

    return this.transformCity(updatedCity);
  }

  async remove(id: number) {
    // Check if city exists
    const city = await this.prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceZones: true,
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    // Check if city has service zones (can't delete if it has dependencies)
    if (city._count.serviceZones > 0) {
      throw new ConflictException(
        `Cannot delete city "${city.name}" because it has ${city._count.serviceZones} associated service zones`,
      );
    }

    await this.prisma.city.delete({
      where: { id },
    });

    this.logger.log(`City deleted: ${city.name}`);

    return { message: 'City deleted successfully' };
  }

  async findByState(stateId: number, activeOnly: boolean = true) {
    const where: any = { stateId };

    if (activeOnly) {
      where.isActive = true;
    }

    const cities = await this.prisma.city.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        isActive: true,
        pricingMultiplier: true,
        serviceRadius: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return cities.map((city) => ({
      ...city,
      pricingMultiplier: Number(city.pricingMultiplier),
    }));
  }

  async toggleActiveStatus(id: number) {
    const city = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }

    const updatedCity = await this.prisma.city.update({
      where: { id },
      data: {
        isActive: !city.isActive,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
            code: true,
            country: {
              select: {
                id: true,
                name: true,
                isoCode2: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `City ${city.name} status changed to: ${updatedCity.isActive ? 'active' : 'inactive'}`,
    );

    return this.transformCity(updatedCity);
  }

  async getCitiesByStateGrouped() {
    const result = await this.prisma.city.groupBy({
      by: ['stateId'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    // Get state names for better readability
    const states = await this.prisma.state.findMany({
      where: {
        id: {
          in: result.map((r) => r.stateId),
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        country: {
          select: {
            id: true,
            name: true,
            isoCode2: true,
          },
        },
      },
    });

    const stateMap = new Map(states.map((s) => [s.id, s]));

    return result.map((item) => ({
      stateId: item.stateId,
      stateName: stateMap.get(item.stateId)?.name || 'Unknown',
      stateCode: stateMap.get(item.stateId)?.code || 'XX',
      countryName: stateMap.get(item.stateId)?.country?.name || 'Unknown',
      countryCode: stateMap.get(item.stateId)?.country?.isoCode2 || 'XX',
      citiesCount: item._count.id,
    }));
  }

  private transformCity(city: any) {
    return {
      ...city,
      pricingMultiplier: Number(city.pricingMultiplier),
      serviceFee: city.serviceFee ? Number(city.serviceFee) : null,
      population: city.population ? Number(city.population) : null,
      areaKm2: city.areaKm2 ? Number(city.areaKm2) : null,
    };
  }

  private transformCityWithCount(city: any) {
    return {
      ...this.transformCity(city),
      serviceZonesCount: city._count?.serviceZones || 0,
      _count: undefined,
    };
  }
}
