import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmergencyContact } from '@prisma/client';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';

@Injectable()
export class EmergencyContactsService {
  constructor(private prisma: PrismaService) {}

  async getUserEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return this.prisma.emergencyContact.findMany({
      where: { userClerkId: userId },
    });
  }

  async createEmergencyContact(createContactDto: CreateEmergencyContactDto): Promise<EmergencyContact> {
    const { userClerkId, contactName, contactPhone } = createContactDto;

    return this.prisma.emergencyContact.create({
      data: {
        userClerkId,
        contactName,
        contactPhone,
      },
    });
  }

  async updateEmergencyContact(id: number, data: any): Promise<EmergencyContact> {
    return this.prisma.emergencyContact.update({
      where: { id },
      data,
    });
  }

  async deleteEmergencyContact(id: number): Promise<EmergencyContact> {
    return this.prisma.emergencyContact.delete({
      where: { id },
    });
  }
}
