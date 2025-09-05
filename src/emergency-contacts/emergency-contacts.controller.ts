import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { EmergencyContactsService } from './emergency-contacts.service';
import { EmergencyContact } from '@prisma/client';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';

@ApiTags('safety')
@Controller('api/user/emergency-contacts')
export class EmergencyContactsController {
  constructor(
    private readonly emergencyContactsService: EmergencyContactsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get user emergency contacts',
    description: 'Retrieve all emergency contacts associated with a specific user'
  })
  @ApiQuery({
    name: 'userId',
    description: 'The Clerk ID of the user whose emergency contacts to retrieve',
    example: 'user_2abc123def456',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of emergency contacts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          userId: { type: 'string', example: 'user_2abc123def456' },
          contactName: { type: 'string', example: 'Jane Doe' },
          contactPhone: { type: 'string', example: '+15551234567' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'User ID is missing or invalid'
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserEmergencyContacts(
    @Query('userId') userId: string,
  ): Promise<EmergencyContact[]> {
    return this.emergencyContactsService.getUserEmergencyContacts(parseInt(userId));
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new emergency contact for a user',
    description: 'Create a new emergency contact that can be notified in case of safety incidents'
  })
  @ApiBody({
    type: CreateEmergencyContactDto,
    description: 'Emergency contact information'
  })
  @ApiResponse({
    status: 201,
    description: 'Emergency contact added successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'string', example: 'user_2abc123def456' },
        contactName: { type: 'string', example: 'Jane Doe' },
        contactPhone: { type: 'string', example: '+15551234567' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required fields or invalid phone number format'
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Emergency contact limit reached (max 5 contacts per user)'
  })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createEmergencyContact(
    @Body() createContactDto: CreateEmergencyContactDto,
  ): Promise<EmergencyContact> {
    return this.emergencyContactsService.createEmergencyContact(
      createContactDto,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update emergency contact',
    description: 'Update information for an existing emergency contact'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the emergency contact',
    example: '1',
    type: Number
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contactName: { type: 'string', example: 'Jane Smith' },
        contactPhone: { type: 'string', example: '+15559876543' }
      }
    },
    description: 'Fields to update (only provided fields will be updated)'
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency contact updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'string', example: 'user_2abc123def456' },
        contactName: { type: 'string', example: 'Jane Smith' },
        contactPhone: { type: 'string', example: '+15559876543' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or phone number format'
  })
  @ApiResponse({ status: 403, description: 'Not authorized to update this contact' })
  @ApiResponse({ status: 404, description: 'Emergency contact not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async updateEmergencyContact(
    @Param('id') id: string,
    @Body() data: any,
  ): Promise<EmergencyContact> {
    return this.emergencyContactsService.updateEmergencyContact(
      Number(id),
      data,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete emergency contact',
    description: 'Remove an emergency contact from the user\'s safety network'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the emergency contact to delete',
    example: '1',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Emergency contact deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'string', example: 'user_2abc123def456' },
        contactName: { type: 'string', example: 'Jane Doe' },
        contactPhone: { type: 'string', example: '+15551234567' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this contact' })
  @ApiResponse({ status: 404, description: 'Emergency contact not found' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async deleteEmergencyContact(
    @Param('id') id: string,
  ): Promise<EmergencyContact> {
    return this.emergencyContactsService.deleteEmergencyContact(Number(id));
  }
}
