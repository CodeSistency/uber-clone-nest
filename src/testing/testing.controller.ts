import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TestingService } from './testing.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { SetServiceStateDto } from './dto/set-service-state.dto';
import { SimulateEventDto } from './dto/simulate-event.dto';

@ApiTags('testing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get('active-services')
  @ApiOperation({
    summary: 'Get all active services',
    description: `
    Returns all active services across all service types (ride, delivery, errand, parcel).
    Useful for testing dashboard to monitor real-time service states.
    Includes service details and participant information.
    `,
  })
  async getActiveServices() {
    const services = await this.testingService.getActiveServices();
    return { data: services };
  }

  @Post('create-service')
  @ApiOperation({
    summary: 'Create a test service',
    description: `
    Creates a new service for testing purposes.
    Supports all service types: ride, delivery, errand, parcel.
    Will use default users/drivers if not specified.
    `,
  })
  async createService(@Body() dto: CreateServiceDto) {
    const service = await this.testingService.createService(dto);
    return { data: service };
  }

  @Post('service/:id/set-state')
  @ApiOperation({
    summary: 'Set service state manually',
    description: `
    Manually sets the state of a service for testing purposes.
    Useful for simulating different service states without going through normal flow.
    `,
  })
  async setServiceState(@Body() dto: SetServiceStateDto) {
    const result = await this.testingService.setServiceState(
      dto.serviceId,
      dto.serviceType,
      dto.state,
    );
    return { data: result };
  }

  @Post('simulate-event')
  @ApiOperation({
    summary: 'Simulate real-time event',
    description: `
    Simulates WebSocket events for testing purposes.
    Useful for testing real-time updates and notifications.
    `,
  })
  async simulateEvent(@Body() dto: SimulateEventDto) {
    const result = await this.testingService.simulateEvent(dto);
    return { data: result };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get service statistics',
    description: `
    Returns statistics about active services by type and status.
    Useful for monitoring system health and load.
    `,
  })
  async getServiceStats() {
    const stats = await this.testingService.getServiceStats();
    return { data: stats };
  }

  @Delete('cleanup')
  @ApiOperation({
    summary: 'Clean up test data',
    description: `
    Removes test services created in the last hour.
    Helps maintain clean test environment.
    `,
  })
  async cleanupTestData() {
    const result = await this.testingService.cleanupTestData();
    return {
      data: result,
      message: 'Test data cleanup completed',
    };
  }
}
