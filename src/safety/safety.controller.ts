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
  @ApiOperation({ summary: 'Trigger an emergency SOS alert' })
  @ApiBody({ type: SOSAlertDto })
  @ApiResponse({ status: 200, description: 'Alert sent successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async triggerSOS(@Body() sosAlertDto: SOSAlertDto): Promise<any> {
    return this.safetyService.triggerSOS(sosAlertDto);
  }

  @Get(':userId/reports')
  @ApiOperation({ summary: 'Get safety reports for a user' })
  @ApiParam({ name: 'userId', description: 'The Clerk ID of the user' })
  @ApiResponse({ status: 200, description: 'Returns safety reports' })
  async getSafetyReports(@Param('userId') userId: string): Promise<any[]> {
    return this.safetyService.getSafetyReports(userId);
  }
}
