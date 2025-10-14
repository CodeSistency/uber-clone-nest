import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateServiceZoneDto,
  UpdateServiceZoneDto,
  ServiceZoneListQueryDto,
  ZoneValidationResultDto,
  CityCoverageAnalysisDto,
} from '../dtos/country.dto';

@Injectable()
export class ServiceZonesService {
  private readonly logger = new Logger(ServiceZonesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createServiceZoneDto: CreateServiceZoneDto) {
    // Check if city exists
    const city = await this.prisma.city.findUnique({
      where: { id: createServiceZoneDto.cityId },
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

    if (!city) {
      throw new NotFoundException(
        `City with ID ${createServiceZoneDto.cityId} not found`,
      );
    }

    // Validate zone boundaries
    const validationResult = await this.validateZoneGeometry(
      createServiceZoneDto,
      createServiceZoneDto.cityId,
    );
    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Invalid zone geometry',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    // Check for unique constraints within the city
    const existingByName = await this.prisma.serviceZone.findFirst({
      where: {
        name: createServiceZoneDto.name,
        cityId: createServiceZoneDto.cityId,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `Zone with name "${createServiceZoneDto.name}" already exists in this city`,
      );
    }

    const zone = await this.prisma.serviceZone.create({
      data: {
        name: createServiceZoneDto.name,
        cityId: createServiceZoneDto.cityId,
        zoneType: createServiceZoneDto.zoneType?.toUpperCase() as any,
        boundaries: createServiceZoneDto.boundaries,
        centerLat: createServiceZoneDto.centerLat,
        centerLng: createServiceZoneDto.centerLng,
        isActive: createServiceZoneDto.isActive ?? true,
        pricingMultiplier: createServiceZoneDto.pricingMultiplier,
        maxDrivers: createServiceZoneDto.maxDrivers,
        minDrivers: createServiceZoneDto.minDrivers,
        peakHours: createServiceZoneDto.peakHours,
        demandMultiplier: createServiceZoneDto.demandMultiplier ?? 1.0,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
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
        },
      },
    });

    this.logger.log(
      `Service zone created: ${zone.name} (${zone.zoneType}) in ${city.name}`,
    );

    return this.transformServiceZone(zone);
  }

  async findAll(query: ServiceZoneListQueryDto) {
    const {
      search,
      cityId,
      stateId,
      zoneType,
      isActive,
      sortBy = 'id',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Validate sortBy field
    const allowedSortFields = ['id', 'zoneType', 'pricingMultiplier', 'demandMultiplier'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`,
      );
    }

    const where: any = {};

    // Search filter
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // City filter
    if (cityId) {
      where.cityId = cityId;
    }

    // State filter (through city relation)
    if (stateId) {
      where.city = {
        stateId: stateId,
      };
    }

    // Zone type filter
    if (zoneType) {
      where.zoneType = this.mapZoneTypeToEnum(zoneType);
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const total = await this.prisma.serviceZone.count({ where });

    const zones = await this.prisma.serviceZone.findMany({
      where,
      select: {
        id: true,
        name: true, // Needed for search filter
        zoneType: true,
        pricingMultiplier: true,
        demandMultiplier: true,
        isActive: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      zones: zones.map((zone) => this.transformServiceZoneListItem(zone)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const zone = await this.prisma.serviceZone.findUnique({
      where: { id },
      include: {
        city: {
          select: {
            id: true,
            name: true,
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
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Service zone with ID ${id} not found`);
    }

    return this.transformServiceZone(zone);
  }

  async update(id: number, updateServiceZoneDto: UpdateServiceZoneDto) {
    // Check if zone exists
    const existingZone = await this.prisma.serviceZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      throw new NotFoundException(`Service zone with ID ${id} not found`);
    }

    // Check if city exists (if being changed)
    if (
      updateServiceZoneDto.cityId &&
      updateServiceZoneDto.cityId !== existingZone.cityId
    ) {
      const city = await this.prisma.city.findUnique({
        where: { id: updateServiceZoneDto.cityId },
      });

      if (!city) {
        throw new NotFoundException(
          `City with ID ${updateServiceZoneDto.cityId} not found`,
        );
      }
    }

    // Validate zone boundaries if being updated
    if (updateServiceZoneDto.boundaries) {
      const targetCityId = updateServiceZoneDto.cityId || existingZone.cityId;
      const validationResult = await this.validateZoneGeometry(
        updateServiceZoneDto,
        targetCityId,
        id,
      );
      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: 'Invalid zone geometry',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        });
      }
    }

    // Check unique constraints only if values are being changed
    const targetCityId = updateServiceZoneDto.cityId || existingZone.cityId;

    if (
      updateServiceZoneDto.name &&
      updateServiceZoneDto.name !== existingZone.name
    ) {
      const existingByName = await this.prisma.serviceZone.findFirst({
        where: {
          name: updateServiceZoneDto.name,
          cityId: targetCityId,
        },
      });

      if (existingByName) {
        throw new ConflictException(
          `Zone with name "${updateServiceZoneDto.name}" already exists in this city`,
        );
      }
    }

    const updatedZone = await this.prisma.serviceZone.update({
      where: { id },
      data: {
        name: updateServiceZoneDto.name,
        cityId: updateServiceZoneDto.cityId,
        zoneType: updateServiceZoneDto.zoneType?.toUpperCase() as any,
        boundaries: updateServiceZoneDto.boundaries,
        centerLat: updateServiceZoneDto.centerLat,
        centerLng: updateServiceZoneDto.centerLng,
        isActive: updateServiceZoneDto.isActive,
        pricingMultiplier: updateServiceZoneDto.pricingMultiplier,
        maxDrivers: updateServiceZoneDto.maxDrivers,
        minDrivers: updateServiceZoneDto.minDrivers,
        peakHours: updateServiceZoneDto.peakHours,
        demandMultiplier: updateServiceZoneDto.demandMultiplier,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
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
        },
      },
    });

    this.logger.log(`Service zone updated: ${updatedZone.name}`);

    return this.transformServiceZone(updatedZone);
  }

  async remove(id: number) {
    // Check if zone exists
    const zone = await this.prisma.serviceZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Service zone with ID ${id} not found`);
    }

    await this.prisma.serviceZone.delete({
      where: { id },
    });

    this.logger.log(`Service zone deleted: ${zone.name}`);

    return { message: 'Service zone deleted successfully' };
  }

  async findByCity(
    cityId: number,
    activeOnly: boolean = true,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: any = { cityId };

    if (activeOnly) {
      where.isActive = true;
    }

    const total = await this.prisma.serviceZone.count({ where });

    const zones = await this.prisma.serviceZone.findMany({
      where,
      select: {
        id: true,
        name: true,
        zoneType: true,
        boundaries: true,
        centerLat: true,
        centerLng: true,
        isActive: true,
        pricingMultiplier: true,
        demandMultiplier: true,
        maxDrivers: true,
        minDrivers: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      zones: zones.map((zone) => ({
        ...zone,
        pricingMultiplier: Number(zone.pricingMultiplier),
        demandMultiplier: Number(zone.demandMultiplier),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getPricingMatrix(
    cityId: number,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;
    const where: any = { cityId, isActive: true };

    const total = await this.prisma.serviceZone.count({ where });

    const zones = await this.prisma.serviceZone.findMany({
      where,
      select: {
        id: true,
        name: true,
        zoneType: true,
        pricingMultiplier: true,
        demandMultiplier: true,
        maxDrivers: true,
        minDrivers: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      cityId,
      zones: zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        type: zone.zoneType,
        pricingMultiplier: Number(zone.pricingMultiplier),
        demandMultiplier: Number(zone.demandMultiplier),
        maxDrivers: zone.maxDrivers,
        minDrivers: zone.minDrivers,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async toggleActiveStatus(id: number) {
    const zone = await this.prisma.serviceZone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException(`Service zone with ID ${id} not found`);
    }

    const updatedZone = await this.prisma.serviceZone.update({
      where: { id },
      data: {
        isActive: !zone.isActive,
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
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
        },
      },
    });

    this.logger.log(
      `Service zone ${zone.name} status changed to: ${updatedZone.isActive ? 'active' : 'inactive'}`,
    );

    return this.transformServiceZone(updatedZone);
  }

  async validateZoneGeometry(
    zoneData: CreateServiceZoneDto | UpdateServiceZoneDto,
    cityId: number,
    excludeZoneId?: number,
  ): Promise<ZoneValidationResultDto> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic GeoJSON validation
      if (!zoneData.boundaries || typeof zoneData.boundaries !== 'object') {
        errors.push('Boundaries must be a valid GeoJSON object');
        return { isValid: false, errors, warnings };
      }

      const boundaries = zoneData.boundaries;

      if (boundaries.type !== 'Polygon') {
        errors.push('Boundaries must be a GeoJSON Polygon');
        return { isValid: false, errors, warnings };
      }

      if (
        !Array.isArray(boundaries.coordinates) ||
        boundaries.coordinates.length === 0
      ) {
        errors.push('Polygon must have coordinates');
        return { isValid: false, errors, warnings };
      }

      // Validate coordinates are within reasonable bounds
      const coords = boundaries.coordinates[0];
      for (const [lng, lat] of coords) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          errors.push(`Invalid coordinates: [${lng}, ${lat}]`);
        }
      }

      // Check for overlaps with existing zones
      const existingZones = await this.prisma.serviceZone.findMany({
        where: {
          cityId,
          isActive: true,
          ...(excludeZoneId && { id: { not: excludeZoneId } }),
        },
        select: {
          id: true,
          name: true,
          boundaries: true,
        },
      });

      // Simple bounding box overlap check (in a real implementation, you'd use PostGIS or similar)
      for (const existingZone of existingZones) {
        if (
          this.geometriesOverlap(boundaries, existingZone.boundaries as any)
        ) {
          warnings.push(
            `Zone may overlap with existing zone "${existingZone.name}"`,
          );
        }
      }

      // Calculate approximate area
      const areaKm2 = this.calculatePolygonArea(boundaries);
      if (areaKm2 > 1000) {
        warnings.push(
          'Zone covers a very large area (>1000 km²), consider splitting',
        );
      } else if (areaKm2 < 0.1) {
        warnings.push(
          'Zone covers a very small area (<0.1 km²), may be too restrictive',
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        coverage: {
          areaKm2,
          overlapPercentage: 0, // Would need PostGIS for accurate calculation
          gapPercentage: 0,
        },
      };
    } catch (error) {
      errors.push(`Geometry validation failed: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  async analyzeCityCoverage(cityId: number): Promise<CityCoverageAnalysisDto> {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        areaKm2: true,
        boundaries: true,
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID ${cityId} not found`);
    }

    const zones = await this.prisma.serviceZone.findMany({
      where: {
        cityId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        zoneType: true,
        boundaries: true,
      },
    });

    // Calculate coverage statistics
    const coverageByType = {
      regular: 0,
      premium: 0,
      restricted: 0,
    };

    let totalCoverageArea = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const zone of zones) {
      const area = this.calculatePolygonArea(zone.boundaries as any);
      coverageByType[zone.zoneType] += area;
      totalCoverageArea += area;
    }

    // Calculate percentages
    const cityArea = city.areaKm2 ? Number(city.areaKm2) : 1000; // Fallback if no area data
    const totalCoverage = Math.min((totalCoverageArea / cityArea) * 100, 100);
    const overlappingArea = 0; // Would need spatial analysis for accurate calculation
    const uncoveredArea = Math.max(100 - totalCoverage - overlappingArea, 0);

    // Generate recommendations
    if (totalCoverage < 70) {
      recommendations.push('Consider adding more zones to increase coverage');
    }

    if (coverageByType.premium < coverageByType.regular * 0.1) {
      recommendations.push(
        'Consider designating premium zones for high-demand areas',
      );
    }

    if (issues.length === 0) {
      issues.push('No geometry issues detected');
    }

    return {
      cityId,
      cityName: city.name,
      totalCoverage,
      overlappingArea,
      uncoveredArea,
      coverageByType: {
        regular: (coverageByType.regular / cityArea) * 100,
        premium: (coverageByType.premium / cityArea) * 100,
        restricted: (coverageByType.restricted / cityArea) * 100,
      },
      issues,
      recommendations,
    };
  }

  private geometriesOverlap(geom1: any, geom2: any): boolean {
    // Simple bounding box overlap check
    // In production, use PostGIS ST_Intersects or similar
    try {
      const bbox1 = this.getBoundingBox(geom1);
      const bbox2 = this.getBoundingBox(geom2);

      return !(
        bbox1.maxLng < bbox2.minLng ||
        bbox1.minLng > bbox2.maxLng ||
        bbox1.maxLat < bbox2.minLat ||
        bbox1.minLat > bbox2.maxLat
      );
    } catch {
      return false;
    }
  }

  private getBoundingBox(geometry: any): {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  } {
    const coords = geometry.coordinates[0];
    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    return { minLng, maxLng, minLat, maxLat };
  }

  private calculatePolygonArea(geometry: any): number {
    // Approximate area calculation using bounding box
    // In production, use proper geospatial area calculation
    try {
      const bbox = this.getBoundingBox(geometry);
      const width = Math.abs(bbox.maxLng - bbox.minLng) * 111; // Rough km conversion
      const height = Math.abs(bbox.maxLat - bbox.minLat) * 111;
      return (
        width *
        height *
        Math.cos((((bbox.minLat + bbox.maxLat) / 2) * Math.PI) / 180)
      );
    } catch {
      return 0;
    }
  }

  private transformServiceZone(zone: any) {
    return {
      ...zone,
      pricingMultiplier: Number(zone.pricingMultiplier),
      demandMultiplier: Number(zone.demandMultiplier),
    };
  }

  private transformServiceZoneListItem(zone: any) {
    return {
      id: zone.id,
      name: zone.name,
      zoneType: zone.zoneType,
      pricingMultiplier: Number(zone.pricingMultiplier),
      demandMultiplier: Number(zone.demandMultiplier),
      isActive: zone.isActive,
    };
  }

  private mapZoneTypeToEnum(zoneType: string): any {
    const zoneTypeMap: { [key: string]: string } = {
      'regular': 'REGULAR',
      'premium': 'PREMIUM',
      'restricted': 'RESTRICTED'
    };

    const mappedType = zoneTypeMap[zoneType.toLowerCase()];
    if (!mappedType) {
      throw new BadRequestException(
        `Invalid zone type: ${zoneType}. Allowed values: regular, premium, restricted`
      );
    }

    return mappedType;
  }
}
