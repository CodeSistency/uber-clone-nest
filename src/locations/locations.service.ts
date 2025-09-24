import { Injectable, Logger } from '@nestjs/common';

export interface ValidateLocationDto {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
  geometry?: {
    lat: number;
    lng: number;
  };
}

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  async validateCoordinates(lat: number, lng: number): Promise<boolean> {
    this.logger.log(`Validating coordinates: lat=${lat}, lng=${lng}`);

    // Basic validation for coordinate ranges
    const isLatValid = lat >= -90 && lat <= 90;
    const isLngValid = lng >= -180 && lng <= 180;

    if (!isLatValid || !isLngValid) {
      this.logger.warn(
        `Invalid coordinates: lat=${lat} (${isLatValid ? 'valid' : 'invalid'}), lng=${lng} (${isLngValid ? 'valid' : 'invalid'})`,
      );
      return false;
    }

    // Additional validation could include:
    // - Checking if coordinates are within service area
    // - Verifying against known problematic areas
    // - Distance from major cities validation

    this.logger.log(`Coordinates validation successful`);
    return true;
  }

  async getAddressSuggestions(
    query: string,
    location?: { lat: number; lng: number },
  ): Promise<AddressSuggestion[]> {
    this.logger.log(`Getting address suggestions for query: "${query}"`);

    // For now, return mock suggestions
    // In production, this would integrate with Google Places API, Mapbox, or similar
    const suggestions: AddressSuggestion[] = [
      {
        placeId: '1',
        description: `${query} - Centro, Caracas`,
        structuredFormatting: {
          mainText: query,
          secondaryText: 'Centro, Caracas',
        },
        geometry: {
          lat: 10.5061,
          lng: -66.9146,
        },
      },
      {
        placeId: '2',
        description: `${query} - La Castellana, Caracas`,
        structuredFormatting: {
          mainText: query,
          secondaryText: 'La Castellana, Caracas',
        },
        geometry: {
          lat: 10.4998,
          lng: -66.8517,
        },
      },
      {
        placeId: '3',
        description: `${query} - Altamira, Caracas`,
        structuredFormatting: {
          mainText: query,
          secondaryText: 'Altamira, Caracas',
        },
        geometry: {
          lat: 10.5028,
          lng: -66.8529,
        },
      },
    ];

    // Filter suggestions based on query
    const filtered = suggestions.filter(
      (suggestion) =>
        suggestion.description.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.structuredFormatting.mainText
          .toLowerCase()
          .includes(query.toLowerCase()),
    );

    this.logger.log(
      `Found ${filtered.length} address suggestions for query "${query}"`,
    );
    return filtered.slice(0, 5); // Limit to 5 suggestions
  }

  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    this.logger.log(`Geocoding address: "${address}"`);

    // Mock geocoding - in production, use Google Geocoding API
    const mockResults: Record<string, { lat: number; lng: number }> = {
      'Centro, Caracas': { lat: 10.5061, lng: -66.9146 },
      'La Castellana, Caracas': { lat: 10.4998, lng: -66.8517 },
      'Altamira, Caracas': { lat: 10.5028, lng: -66.8529 },
      'Chacao, Caracas': { lat: 10.4969, lng: -66.8529 },
      'Sabana Grande, Caracas': { lat: 10.5038, lng: -66.9211 },
    };

    const result = Object.entries(mockResults).find(([key]) =>
      address.toLowerCase().includes(key.toLowerCase()),
    );

    if (result) {
      this.logger.log(
        `Geocoding successful for "${address}": ${JSON.stringify(result[1])}`,
      );
      return result[1];
    }

    // Fallback coordinates for Caracas
    const fallback = { lat: 10.5061, lng: -66.9146 };
    this.logger.log(
      `Geocoding fallback for "${address}": ${JSON.stringify(fallback)}`,
    );
    return fallback;
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    this.logger.log(`Reverse geocoding coordinates: lat=${lat}, lng=${lng}`);

    // Mock reverse geocoding - in production, use Google Reverse Geocoding API
    const mockAddresses: Record<string, string> = {
      '10.5061,-66.9146': 'Centro, Caracas, Venezuela',
      '10.4998,-66.8517': 'La Castellana, Caracas, Venezuela',
      '10.5028,-66.8529': 'Altamira, Caracas, Venezuela',
      '10.4969,-66.8529': 'Chacao, Caracas, Venezuela',
      '10.5038,-66.9211': 'Sabana Grande, Caracas, Venezuela',
    };

    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const address = mockAddresses[key] || 'Caracas, Venezuela';

    this.logger.log(`Reverse geocoding result for ${key}: "${address}"`);
    return address;
  }

  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ): Promise<number> {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLng = this.toRadians(destination.lng - origin.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(origin.lat)) *
        Math.cos(this.toRadians(destination.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  async estimateTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    transportMode: 'driving' | 'walking' = 'driving',
  ): Promise<number> {
    const distance = await this.calculateDistance(origin, destination);

    // Rough estimates based on typical speeds
    const speedKmh = transportMode === 'driving' ? 30 : 5; // km/h
    const timeHours = distance / speedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    return Math.max(timeMinutes, 5); // Minimum 5 minutes
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async validateServiceArea(
    lat: number,
    lng: number,
  ): Promise<{ valid: boolean; message?: string }> {
    // Check if location is within service area (Caracas metropolitan area)
    const caracasCenter = { lat: 10.5061, lng: -66.9146 };
    const distance = await this.calculateDistance({ lat, lng }, caracasCenter);

    if (distance > 50) {
      // 50km radius
      return {
        valid: false,
        message: 'Location is outside our current service area',
      };
    }

    return { valid: true };
  }

  async checkMatchingDistance(
    userLocation: { lat: number; lng: number },
    driverLocation: { lat: number; lng: number },
    maxRadiusKm: number = 5,
  ): Promise<{
    distance: number;
    isWithinRange: boolean;
    maxRadius: number;
    userLocation: { lat: number; lng: number };
    driverLocation: { lat: number; lng: number };
    details: {
      distanceKm: number;
      maxRadiusKm: number;
      differenceKm: number;
      canMatch: boolean;
    };
  }> {
    this.logger.log(`🔍 Checking matching distance between user (${userLocation.lat}, ${userLocation.lng}) and driver (${driverLocation.lat}, ${driverLocation.lng})`);

    const distanceKm = await this.calculateDistance(userLocation, driverLocation);
    const isWithinRange = distanceKm <= maxRadiusKm;
    const differenceKm = Math.max(0, distanceKm - maxRadiusKm);

    const result = {
      distance: distanceKm,
      isWithinRange,
      maxRadius: maxRadiusKm,
      userLocation,
      driverLocation,
      details: {
        distanceKm,
        maxRadiusKm,
        differenceKm,
        canMatch: isWithinRange,
      },
    };

    this.logger.log(`📏 Distance check result: ${distanceKm}km (max: ${maxRadiusKm}km) - ${isWithinRange ? '✅ WITHIN RANGE' : '❌ OUT OF RANGE'}`);

    if (!isWithinRange) {
      this.logger.warn(`🚫 Driver is ${differenceKm}km too far for matching (max allowed: ${maxRadiusKm}km)`);
    }

    return result;
  }

  async getNearbyPlaces(
    lat: number,
    lng: number,
    type: 'restaurant' | 'store' | 'pharmacy' = 'store',
    radius: number = 1000,
  ): Promise<any[]> {
    // Mock nearby places - in production, use Google Places API
    const mockPlaces = [
      {
        id: '1',
        name: 'Supermercado Éxito',
        address: 'Centro, Caracas',
        distance: 0.5,
        rating: 4.2,
      },
      {
        id: '2',
        name: 'Farmacia Caracas',
        address: 'La Castellana, Caracas',
        distance: 1.2,
        rating: 4.5,
      },
      {
        id: '3',
        name: 'Restaurant El Patio',
        address: 'Altamira, Caracas',
        distance: 0.8,
        rating: 4.1,
      },
    ];

    return mockPlaces.filter((place) => place.distance <= radius / 1000);
  }
}
