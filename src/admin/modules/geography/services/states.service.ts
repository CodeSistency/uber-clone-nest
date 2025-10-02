import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateStateDto,
  UpdateStateDto,
  StateListQueryDto,
} from '../dtos/country.dto';

@Injectable()
export class StatesService {
  private readonly logger = new Logger(StatesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createStateDto: CreateStateDto) {
    // Check if country exists
    const country = await this.prisma.country.findUnique({
      where: { id: createStateDto.countryId },
    });

    if (!country) {
      throw new NotFoundException(
        `Country with ID ${createStateDto.countryId} not found`,
      );
    }

    // Check for unique constraints within the country
    const existingByName = await this.prisma.state.findFirst({
      where: {
        name: createStateDto.name,
        countryId: createStateDto.countryId,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `State with name "${createStateDto.name}" already exists in this country`,
      );
    }

    const existingByCode = await this.prisma.state.findFirst({
      where: {
        code: createStateDto.code,
        countryId: createStateDto.countryId,
      },
    });

    if (existingByCode) {
      throw new ConflictException(
        `State with code "${createStateDto.code}" already exists in this country`,
      );
    }

    const state = await this.prisma.state.create({
      data: {
        name: createStateDto.name,
        code: createStateDto.code,
        countryId: createStateDto.countryId,
        latitude: createStateDto.latitude,
        longitude: createStateDto.longitude,
        timezone: createStateDto.timezone,
        isActive: createStateDto.isActive ?? true,
        pricingMultiplier: createStateDto.pricingMultiplier,
        serviceFee: createStateDto.serviceFee,
        capital: createStateDto.capital,
        population: createStateDto.population,
        areaKm2: createStateDto.areaKm2,
      },
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

    this.logger.log(
      `State created: ${state.name} (${state.code}) in ${state.country.name}`,
    );

    return this.transformState(state);
  }

  async findAll(query: StateListQueryDto) {
    const {
      search,
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
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { capital: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Country filter
    if (countryId) {
      where.countryId = countryId;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const total = await this.prisma.state.count({ where });

    const states = await this.prisma.state.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        country: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      states: states.map((state) => this.transformStateListItem(state)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const state = await this.prisma.state.findUnique({
      where: { id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
            isoCode2: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    if (!state) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    return this.transformStateWithCount(state);
  }

  async update(id: number, updateStateDto: UpdateStateDto) {
    // Check if state exists
    const existingState = await this.prisma.state.findUnique({
      where: { id },
    });

    if (!existingState) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    // Check if country exists (if being changed)
    if (
      updateStateDto.countryId &&
      updateStateDto.countryId !== existingState.countryId
    ) {
      const country = await this.prisma.country.findUnique({
        where: { id: updateStateDto.countryId },
      });

      if (!country) {
        throw new NotFoundException(
          `Country with ID ${updateStateDto.countryId} not found`,
        );
      }
    }

    // Check unique constraints only if values are being changed
    const targetCountryId = updateStateDto.countryId || existingState.countryId;

    if (updateStateDto.name && updateStateDto.name !== existingState.name) {
      const existingByName = await this.prisma.state.findFirst({
        where: {
          name: updateStateDto.name,
          countryId: targetCountryId,
        },
      });

      if (existingByName) {
        throw new ConflictException(
          `State with name "${updateStateDto.name}" already exists in this country`,
        );
      }
    }

    if (updateStateDto.code && updateStateDto.code !== existingState.code) {
      const existingByCode = await this.prisma.state.findFirst({
        where: {
          code: updateStateDto.code,
          countryId: targetCountryId,
        },
      });

      if (existingByCode) {
        throw new ConflictException(
          `State with code "${updateStateDto.code}" already exists in this country`,
        );
      }
    }

    const updatedState = await this.prisma.state.update({
      where: { id },
      data: {
        name: updateStateDto.name,
        code: updateStateDto.code,
        countryId: updateStateDto.countryId,
        latitude: updateStateDto.latitude,
        longitude: updateStateDto.longitude,
        timezone: updateStateDto.timezone,
        isActive: updateStateDto.isActive,
        pricingMultiplier: updateStateDto.pricingMultiplier,
        serviceFee: updateStateDto.serviceFee,
        capital: updateStateDto.capital,
        population: updateStateDto.population,
        areaKm2: updateStateDto.areaKm2,
      },
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

    this.logger.log(
      `State updated: ${updatedState.name} (${updatedState.code})`,
    );

    return this.transformState(updatedState);
  }

  async remove(id: number) {
    // Check if state exists
    const state = await this.prisma.state.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    if (!state) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    // Check if state has cities (can't delete if it has dependencies)
    if (state._count.cities > 0) {
      throw new ConflictException(
        `Cannot delete state "${state.name}" because it has ${state._count.cities} associated cities`,
      );
    }

    await this.prisma.state.delete({
      where: { id },
    });

    this.logger.log(`State deleted: ${state.name} (${state.code})`);

    return { message: 'State deleted successfully' };
  }

  async findByCountry(countryId: number, activeOnly: boolean = true) {
    const where: any = { countryId };

    if (activeOnly) {
      where.isActive = true;
    }

    const total = await this.prisma.state.count({ where });

    const states = await this.prisma.state.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        country: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      states: states.map((state) => this.transformStateListItem(state)),
      total,
      page: 1,
      limit: total,
      totalPages: 1,
    };
  }

  async toggleActiveStatus(id: number) {
    const state = await this.prisma.state.findUnique({
      where: { id },
    });

    if (!state) {
      throw new NotFoundException(`State with ID ${id} not found`);
    }

    const updatedState = await this.prisma.state.update({
      where: { id },
      data: {
        isActive: !state.isActive,
      },
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

    this.logger.log(
      `State ${state.name} status changed to: ${updatedState.isActive ? 'active' : 'inactive'}`,
    );

    return this.transformState(updatedState);
  }

  async getStatesByCountryGrouped() {
    const result = await this.prisma.state.groupBy({
      by: ['countryId'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    // Get country names for better readability
    const countries = await this.prisma.country.findMany({
      where: {
        id: {
          in: result.map((r) => r.countryId),
        },
      },
      select: {
        id: true,
        name: true,
        isoCode2: true,
      },
    });

    const countryMap = new Map(countries.map((c) => [c.id, c]));

    return result.map((item) => ({
      countryId: item.countryId,
      countryName: countryMap.get(item.countryId)?.name || 'Unknown',
      countryCode: countryMap.get(item.countryId)?.isoCode2 || 'XX',
      statesCount: item._count.id,
    }));
  }

  private transformState(state: any) {
    return {
      ...state,
      pricingMultiplier: Number(state.pricingMultiplier),
      serviceFee: state.serviceFee ? Number(state.serviceFee) : null,
      population: state.population ? Number(state.population) : null,
      areaKm2: state.areaKm2 ? Number(state.areaKm2) : null,
    };
  }

  private transformStateWithCount(state: any) {
    return {
      ...this.transformState(state),
      citiesCount: state._count?.cities || 0,
      _count: undefined,
    };
  }

  private transformStateListItem(state: any) {
    return {
      id: state.id,
      name: state.name,
      code: state.code,
      countryName: state.country?.name || 'Unknown',
      isActive: state.isActive,
      citiesCount: state._count?.cities || 0,
    };
  }
}
