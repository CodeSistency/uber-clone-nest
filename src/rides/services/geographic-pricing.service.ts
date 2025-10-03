import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCacheService } from './pricing-cache.service';

export interface GeographicZone {
  city?: {
    id: number;
    name: string;
    pricingMultiplier: number;
    restrictedAreas?: any;
  } | null;
  zone?: {
    id: number;
    name: string;
    zoneType: string;
    pricingMultiplier: number;
    demandMultiplier: number;
    boundaries?: any;
  } | null;
  multipliers: {
    city: number;
    zone: number;
    total: number;
  };
  restrictions: {
    isAllowed: boolean;
    reason?: string;
  };
}

@Injectable()
export class GeographicPricingService {
  private readonly logger = new Logger(GeographicPricingService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: PricingCacheService,
  ) {}

  /**
   * Find geographic zone information for given coordinates
   */
  async findGeographicZone(
    userLat: number,
    userLng: number,
  ): Promise<GeographicZone> {
    try {
      // Check cache first
      const cached = await this.cacheService.getGeographicZone(userLat, userLng);
      if (cached) {
        this.logger.debug(`Using cached geographic zone for ${userLat}, ${userLng}`);
        return cached;
      }

      // 1. Find nearest city using distance calculation
      const nearestCity = await this.findNearestCity(userLat, userLng);

      // 2. Find containing service zone (if any)
      const containingZone = await this.findContainingServiceZone(userLat, userLng);

      // 3. Calculate multipliers
      const multipliers = this.calculateGeographicMultipliers(nearestCity, containingZone);

      // 4. Check restrictions
      const restrictions = this.checkZoneRestrictions(nearestCity, containingZone, userLat, userLng);

      const result = {
        city: nearestCity,
        zone: containingZone,
        multipliers,
        restrictions,
      };

      // Cache the result
      await this.cacheService.setGeographicZone(userLat, userLng, result);

      return result;
    } catch (error) {
      this.logger.error(`Error finding geographic zone for ${userLat}, ${userLng}:`, error);
      // Return default values if geographic lookup fails
      return {
        multipliers: { city: 1.0, zone: 1.0, total: 1.0 },
        restrictions: { isAllowed: true },
      };
    }
  }

  /**
   * Find the nearest city to given coordinates
   */
  private async findNearestCity(userLat: number, userLng: number) {
    // Get all cities and calculate distances
    const cities = await this.prisma.city.findMany({
      include: {
        state: {
          include: {
            country: true,
          },
        },
      },
    });

    if (cities.length === 0) {
      return null;
    }

    // Find city with minimum distance
    let nearestCity: {
      id: number;
      name: string;
      pricingMultiplier: number;
      restrictedAreas: any;
    } | null = null;
    let minDistance = Number.MAX_VALUE;

    for (const city of cities) {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        Number(city.latitude),
        Number(city.longitude),
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = {
          id: city.id,
          name: city.name,
          pricingMultiplier: Number(city.pricingMultiplier || 1.0),
          restrictedAreas: city.restrictedAreas,
        };
      }
    }

    return nearestCity;
  }

  /**
   * Find service zone that contains the given coordinates
   * Note: This is a simplified implementation. In production with PostGIS,
   * you would use ST_Contains or similar spatial functions.
   */
  private async findContainingServiceZone(userLat: number, userLng: number) {
    // Get all service zones
    const zones = await this.prisma.serviceZone.findMany({
      include: {
        city: true,
      },
    });

    // For each zone, check if coordinates are within boundaries
    // This is a simplified check - in production use proper GeoJSON containment
    for (const zone of zones) {
      if (this.isPointInZone(userLat, userLng, zone)) {
        return {
          id: zone.id,
          name: zone.name,
          zoneType: zone.zoneType,
          pricingMultiplier: Number(zone.pricingMultiplier || 1.0),
          demandMultiplier: Number(zone.demandMultiplier || 1.0),
          boundaries: zone.boundaries,
        };
      }
    }

    return null;
  }

  /**
   * Calculate geographic multipliers based on city and zone
   */
  private calculateGeographicMultipliers(city: any, zone: any) {
    const cityMultiplier = city?.pricingMultiplier || 1.0;
    const zoneMultiplier = zone?.pricingMultiplier || 1.0;

    // Combine multipliers (multiply them)
    const total = cityMultiplier * zoneMultiplier;

    return {
      city: cityMultiplier,
      zone: zoneMultiplier,
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Check if location is in a restricted zone
   */
  private checkZoneRestrictions(city: any, zone: any, userLat: number, userLng: number) {
    // Check if service zone is restricted
    if (zone?.zoneType === 'restricted') {
      return {
        isAllowed: false,
        reason: `Service not available in ${zone.name} zone`,
      };
    }

    // Check if city has restricted areas
    if (city?.restrictedAreas && this.isPointInRestrictedArea(userLat, userLng, city.restrictedAreas)) {
      return {
        isAllowed: false,
        reason: 'Service not available in this area',
      };
    }

    return {
      isAllowed: true,
    };
  }

  /**
   * Simple point-in-zone check (simplified - in production use proper GeoJSON)
   */
  private isPointInZone(lat: number, lng: number, zone: any): boolean {
    // This is a placeholder implementation
    // In production, you would use proper GeoJSON containment logic
    // For now, check if point is within a radius of zone center
    if (!zone.centerLat || !zone.centerLng) {
      return false;
    }

    const distance = this.calculateDistance(
      lat,
      lng,
      Number(zone.centerLat),
      Number(zone.centerLng),
    );

    // Assume zones are circular with ~5km radius for this simplified check
    return distance <= 5;
  }

  /**
   * Check if point is in restricted area (simplified)
   */
  private isPointInRestrictedArea(lat: number, lng: number, restrictedAreas: any): boolean {
    // This is a placeholder - in production parse GeoJSON and check containment
    // For now, return false (no restrictions)
    return false;
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const earthRadius = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }
}
