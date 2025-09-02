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
  @ApiOperation({ summary: 'Get user emergency contacts' })
  @ApiQuery({ name: 'userId', description: 'The Clerk ID of the user' })
  @ApiResponse({ status: 200, description: 'Returns an array of contacts' })
  @ApiResponse({ status: 400, description: 'User ID is missing' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async getUserEmergencyContacts(
    @Query('userId') userId: string,
  ): Promise<EmergencyContact[]> {
    return this.emergencyContactsService.getUserEmergencyContacts(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new emergency contact for a user' })
  @ApiBody({ type: CreateEmergencyContactDto })
  @ApiResponse({ status: 201, description: 'Contact added successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'Database error' })
  async createEmergencyContact(
    @Body() createContactDto: CreateEmergencyContactDto,
  ): Promise<EmergencyContact> {
    return this.emergencyContactsService.createEmergencyContact(
      createContactDto,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update emergency contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
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
  @ApiOperation({ summary: 'Delete emergency contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  async deleteEmergencyContact(
    @Param('id') id: string,
  ): Promise<EmergencyContact> {
    return this.emergencyContactsService.deleteEmergencyContact(Number(id));
  }
}
