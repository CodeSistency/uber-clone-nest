import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import { SOSAlertDto } from './dto/sos-alert.dto';

@ApiTags('safety')
@Controller('api/safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('sos')
  @ApiOperation({
    summary: 'Trigger an emergency SOS alert',
    description: 'Send an emergency alert during a ride that will notify authorities and emergency contacts'
  })
  @ApiBody({
    type: SOSAlertDto,
    description: 'Emergency alert details including location and situation description'
  })
  @ApiResponse({
    status: 200,
    description: 'SOS alert triggered successfully - emergency services and contacts notified',
    schema: {
      type: 'object',
      properties: {
        alertId: { type: 'string', example: 'sos_123456' },
        status: { type: 'string', example: 'triggered' },
        notified: {
          type: 'object',
          properties: {
            authorities: { type: 'boolean', example: true },
            emergencyContacts: { type: 'boolean', example: true },
            driver: { type: 'boolean', example: true }
          }
        },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number', example: 40.7128 },
            longitude: { type: 'number', example: -74.006 }
          }
        },
        emergencyType: { type: 'string', example: 'medical' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid data format'
  })
  @ApiResponse({
    status: 403,
    description: 'User not authorized to trigger SOS for this ride'
  })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 429, description: 'Too many SOS alerts - rate limit exceeded' })
  @ApiResponse({ status: 500, description: 'Database error or notification service failure' })
  async triggerSOS(@Body() sosAlertDto: SOSAlertDto): Promise<any> {
    return this.safetyService.triggerSOS(sosAlertDto);
  }

  @Get(':userId/reports')
  @ApiOperation({
    summary: 'Get safety reports for a user',
    description: 'Retrieve all safety-related incidents and reports associated with a specific user'
  })
  @ApiParam({
    name: 'userId',
    description: 'The Clerk ID of the user whose safety reports to retrieve',
    example: 'user_2abc123def456'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of safety reports and incidents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'report_123' },
          type: { type: 'string', example: 'sos_alert', enum: ['sos_alert', 'safety_check', 'incident_report'] },
          rideId: { type: 'number', example: 1 },
          status: { type: 'string', example: 'resolved', enum: ['pending', 'investigating', 'resolved', 'closed'] },
          emergencyType: { type: 'string', example: 'medical', enum: ['medical', 'safety', 'vehicle', 'other'] },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: 40.7128 },
              longitude: { type: 'number', example: -74.006 }
            }
          },
          description: { type: 'string', example: 'Medical emergency during ride' },
          created_at: { type: 'string', format: 'date-time' },
          resolved_at: { type: 'string', format: 'date-time', nullable: true },
          authorities_notified: { type: 'boolean', example: true },
          emergency_contacts_notified: { type: 'boolean', example: true }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'User ID is missing or invalid'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to view these safety reports' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getSafetyReports(@Param('userId') userId: string): Promise<any[]> {
    return this.safetyService.getSafetyReports(userId);
  }
}
