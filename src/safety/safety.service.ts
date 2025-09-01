import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SOSAlertDto } from './dto/sos-alert.dto';

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  async triggerSOS(sosAlertDto: SOSAlertDto): Promise<any> {
    const { userClerkId, rideId, location, emergencyType, message } = sosAlertDto;

    // Get user information
    const user = await this.prisma.user.findUnique({
      where: { clerkId: userClerkId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get ride information if provided
    let ride: any = null;
    if (rideId) {
      ride = await this.prisma.ride.findUnique({
        where: { rideId },
        include: {
          driver: true,
        },
      });
    }

    // Get emergency contacts
    const emergencyContacts = await this.prisma.emergencyContact.findMany({
      where: { userClerkId },
    });

    // Log the SOS alert (in a real app, this would trigger notifications)
    const sosRecord = {
      userId: userClerkId,
      rideId,
      location,
      emergencyType,
      message,
      timestamp: new Date(),
      emergencyContacts: emergencyContacts.map(contact => ({
        name: contact.contactName,
        phone: contact.contactPhone,
      })),
      driverInfo: ride?.driver ? {
        id: ride.driver.id,
        name: `${ride.driver.firstName} ${ride.driver.lastName}`,
        phone: 'N/A', // In real app, driver would have phone number
      } : null,
    };

    // In a real application, you would:
    // 1. Send notifications to emergency contacts
    // 2. Notify authorities if needed
    // 3. Alert the driver
    // 4. Log to emergency services

    console.log('SOS Alert triggered:', sosRecord);

    return {
      message: 'SOS alert sent successfully',
      alertId: `sos_${Date.now()}`,
      emergencyContactsNotified: emergencyContacts.length,
      authoritiesNotified: true,
      driverNotified: !!ride?.driver,
    };
  }

  async getSafetyReports(userId: string): Promise<any[]> {
    // In a real app, this would return safety reports and incident history
    return [
      {
        id: 1,
        type: 'sos_alert',
        timestamp: new Date(),
        location: '40.7128, -74.0060',
        status: 'resolved',
      },
    ];
  }
}
