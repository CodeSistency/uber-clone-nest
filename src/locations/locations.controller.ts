import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { ValidateLocationDto } from './dto/validate-location.dto';

@ApiTags('locations')
@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('validate')
  @ApiOperation({
    summary: 'Validate coordinates',
    description: `
    Validates that the provided latitude and longitude coordinates are within valid ranges.
    Also checks if the location is within the service area.
    `,
  })
  async validate(@Body() dto: ValidateLocationDto) {
    const isValid = await this.locationsService.validateCoordinates(
      dto.lat,
      dto.lng,
    );
    const serviceAreaCheck = await this.locationsService.validateServiceArea(
      dto.lat,
      dto.lng,
    );

    return {
      data: {
        isValid,
        serviceArea: serviceAreaCheck,
      },
    };
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get address suggestions',
    description: `
    Returns address suggestions based on a search query.
    Useful for autocomplete functionality in address inputs.
    `,
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query for address suggestions',
    example: 'Centro, Caracas',
    type: 'string',
  })
  async getSuggestions(@Query('q') query: string) {
    const suggestions =
      await this.locationsService.getAddressSuggestions(query);
    return { data: suggestions };
  }

  @Get('reverse-geocode')
  @ApiOperation({
    summary: 'Reverse geocode coordinates to address',
    description: `
    Converts latitude and longitude coordinates to a human-readable address.
    `,
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude coordinate',
    example: 10.5061,
    type: 'number',
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude coordinate',
    example: -66.9146,
    type: 'number',
  })
  async reverseGeocode(@Query('lat') lat: number, @Query('lng') lng: number) {
    const address = await this.locationsService.reverseGeocode(lat, lng);
    return { data: { address } };
  }

  @Get('geocode')
  @ApiOperation({
    summary: 'Geocode address to coordinates',
    description: `
    Converts a human-readable address to latitude and longitude coordinates.
    `,
  })
  @ApiQuery({
    name: 'address',
    description: 'Address to geocode',
    example: 'Centro, Caracas, Venezuela',
    type: 'string',
  })
  async geocode(@Query('address') address: string) {
    const coordinates = await this.locationsService.geocodeAddress(address);
    return { data: { coordinates } };
  }

  @Get('calculate-distance')
  @ApiOperation({
    summary: 'Calculate distance between two points',
    description: `
    Calculates the distance between two geographic points in kilometers.
    `,
  })
  @ApiQuery({
    name: 'originLat',
    description: 'Origin latitude',
    example: 10.5061,
    type: 'number',
  })
  @ApiQuery({
    name: 'originLng',
    description: 'Origin longitude',
    example: -66.9146,
    type: 'number',
  })
  @ApiQuery({
    name: 'destLat',
    description: 'Destination latitude',
    example: 10.4998,
    type: 'number',
  })
  @ApiQuery({
    name: 'destLng',
    description: 'Destination longitude',
    example: -66.8517,
    type: 'number',
  })
  async calculateDistance(
    @Query('originLat') originLat: number,
    @Query('originLng') originLng: number,
    @Query('destLat') destLat: number,
    @Query('destLng') destLng: number,
  ) {
    const distance = await this.locationsService.calculateDistance(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
    );
    return { data: { distance } };
  }

  @Get('estimate-time')
  @ApiOperation({
    summary: 'Estimate travel time',
    description: `
    Estimates travel time between two points based on distance and transport mode.
    `,
  })
  @ApiQuery({
    name: 'originLat',
    description: 'Origin latitude',
    example: 10.5061,
    type: 'number',
  })
  @ApiQuery({
    name: 'originLng',
    description: 'Origin longitude',
    example: -66.9146,
    type: 'number',
  })
  @ApiQuery({
    name: 'destLat',
    description: 'Destination latitude',
    example: 10.4998,
    type: 'number',
  })
  @ApiQuery({
    name: 'destLng',
    description: 'Destination longitude',
    example: -66.8517,
    type: 'number',
  })
  @ApiQuery({
    name: 'mode',
    description: 'Transport mode',
    example: 'driving',
    enum: ['driving', 'walking'],
    required: false,
    type: 'string',
  })
  async estimateTime(
    @Query('originLat') originLat: number,
    @Query('originLng') originLng: number,
    @Query('destLat') destLat: number,
    @Query('destLng') destLng: number,
    @Query('mode') mode: 'driving' | 'walking' = 'driving',
  ) {
    const timeMinutes = await this.locationsService.estimateTravelTime(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
      mode,
    );
    return { data: { timeMinutes } };
  }

  @Get('check-matching-distance')
  @ApiOperation({
    summary: 'Check if two locations are within matching distance',
    description: `
    Verifies if two geographic points are within the distance range used for driver-passenger matching.
    Uses the same distance calculation algorithm as the ride matching system.
    `,
  })
  @ApiQuery({
    name: 'userLat',
    description: 'User pickup location latitude',
    example: 4.6097,
    type: 'number',
  })
  @ApiQuery({
    name: 'userLng',
    description: 'User pickup location longitude',
    example: -74.0817,
    type: 'number',
  })
  @ApiQuery({
    name: 'driverLat',
    description: 'Driver current location latitude',
    example: 4.6767,
    type: 'number',
  })
  @ApiQuery({
    name: 'driverLng',
    description: 'Driver current location longitude',
    example: -74.0483,
    type: 'number',
  })
  @ApiQuery({
    name: 'maxRadiusKm',
    description: 'Maximum matching radius in kilometers (default: 5)',
    example: 5,
    required: false,
    type: 'number',
  })
  async checkMatchingDistance(
    @Query('userLat') userLat: number,
    @Query('userLng') userLng: number,
    @Query('driverLat') driverLat: number,
    @Query('driverLng') driverLng: number,
    @Query('maxRadiusKm') maxRadiusKm: number = 5,
  ) {
    const result = await this.locationsService.checkMatchingDistance(
      { lat: userLat, lng: userLng },
      { lat: driverLat, lng: driverLng },
      maxRadiusKm,
    );
    return { data: result };
  }

  @Get('nearby-places')
  @ApiOperation({
    summary: 'Find nearby places',
    description: `
    Finds nearby places of a specific type (restaurant, store, pharmacy) within a radius.
    `,
  })
  @ApiQuery({
    name: 'lat',
    description: 'Center latitude',
    example: 10.5061,
    type: 'number',
  })
  @ApiQuery({
    name: 'lng',
    description: 'Center longitude',
    example: -66.9146,
    type: 'number',
  })
  @ApiQuery({
    name: 'type',
    description: 'Type of places to search',
    example: 'restaurant',
    enum: ['restaurant', 'store', 'pharmacy'],
    type: 'string',
  })
  @ApiQuery({
    name: 'radius',
    description: 'Search radius in meters',
    example: 1000,
    required: false,
    type: 'number',
  })
  async getNearbyPlaces(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('type') type: string,
    @Query('radius') radius: number = 1000,
  ) {
    const places = await this.locationsService.getNearbyPlaces(
      lat,
      lng,
      type as any,
      radius,
    );
    return { data: places };
  }
}
