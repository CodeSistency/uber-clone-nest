import { Controller, Post, Put, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  OnboardingLocationDto,
  OnboardingPersonalDto,
  OnboardingPreferencesDto,
  OnboardingVerificationDto,
  CompleteOnboardingDto,
  OnboardingStatusDto
} from './dto/onboarding.dto';

@ApiTags('onboarding')
@Controller('api/onboarding')
export class OnboardingController {
  constructor(private readonly usersService: UsersService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get onboarding status',
    description: 'Check the current onboarding status for the authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status retrieved successfully',
    type: OnboardingStatusDto
  })
  async getOnboardingStatus(@GetUser() user: any): Promise<OnboardingStatusDto> {
    const userProfile = await this.usersService.getCurrentUser(user.id);

    // Determine completed steps based on filled fields
    const completedSteps: string[] = [];

    if (userProfile?.country && userProfile?.state && userProfile?.city) {
      completedSteps.push('location');
    }

    if (userProfile?.phone && userProfile?.dateOfBirth && userProfile?.gender) {
      completedSteps.push('personal');
    }

    if (userProfile?.preferredLanguage && userProfile?.timezone && userProfile?.currency) {
      completedSteps.push('preferences');
    }

    if (userProfile?.phoneVerified) {
      completedSteps.push('verification');
    }

    const isCompleted = completedSteps.length >= 3; // location, personal, preferences
    const nextStep = this.getNextStep(completedSteps);
    const progress = (completedSteps.length / 4) * 100;

    return {
      isCompleted,
      completedSteps,
      nextStep,
      progress: Math.round(progress)
    };
  }

  @Post('location')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Set user location',
    description: 'Update user location information (country, state, city)'
  })
  @ApiBody({ type: OnboardingLocationDto })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
  })
  async setLocation(
    @GetUser() user: any,
    @Body() locationData: OnboardingLocationDto
  ): Promise<any> {
    await this.usersService.updateCurrentUser(user.id, {
      country: locationData.country,
      state: locationData.state,
      city: locationData.city,
      postalCode: locationData.postalCode
    });

    return {
      message: 'Location updated successfully',
      data: locationData
    };
  }

  @Post('personal')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Set personal information',
    description: 'Update user personal information (phone, date of birth, gender)'
  })
  @ApiBody({ type: OnboardingPersonalDto })
  @ApiResponse({
    status: 200,
    description: 'Personal information updated successfully',
  })
  async setPersonalInfo(
    @GetUser() user: any,
    @Body() personalData: OnboardingPersonalDto
  ): Promise<any> {
    await this.usersService.updateCurrentUser(user.id, {
      phone: personalData.phone,
      dateOfBirth: personalData.dateOfBirth,
      gender: personalData.gender
    });

    return {
      message: 'Personal information updated successfully',
      data: personalData
    };
  }

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Set user preferences',
    description: 'Update user preferences (language, timezone, currency)'
  })
  @ApiBody({ type: OnboardingPreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
  })
  async setPreferences(
    @GetUser() user: any,
    @Body() preferencesData: OnboardingPreferencesDto
  ): Promise<any> {
    await this.usersService.updateCurrentUser(user.id, {
      preferredLanguage: preferencesData.preferredLanguage,
      timezone: preferencesData.timezone,
      currency: preferencesData.currency
    });

    return {
      message: 'Preferences updated successfully',
      data: preferencesData
    };
  }

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Send phone verification code',
    description: 'Send SMS verification code to user phone number'
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  async sendPhoneVerification(@GetUser() user: any): Promise<any> {
    // TODO: Implement SMS service integration
    // For now, just mark as verified for demo purposes
    await this.usersService.updateCurrentUser(user.id, {
      phoneVerified: true
    });

    return {
      message: 'Verification code sent to your phone',
      note: 'In production, this would send an actual SMS'
    };
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Send email verification code',
    description: 'Send email verification code to user email address'
  })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  async sendEmailVerification(@GetUser() user: any): Promise<any> {
    // TODO: Implement email service integration
    // For now, just mark as verified for demo purposes
    await this.usersService.updateCurrentUser(user.id, {
      emailVerified: true
    });

    return {
      message: 'Verification code sent to your email',
      note: 'In production, this would send an actual email'
    };
  }

  @Post('verify-code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Verify phone/email code',
    description: 'Verify the code sent to phone or email'
  })
  @ApiBody({ type: OnboardingVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
  })
  async verifyCode(
    @GetUser() user: any,
    @Body() verificationData: OnboardingVerificationDto
  ): Promise<any> {
    // TODO: Implement actual code verification
    // For now, accept any code for demo purposes

    const updates: any = {};
    if (verificationData.phoneVerificationCode) {
      updates.phoneVerified = true;
    }
    if (verificationData.emailVerificationCode) {
      updates.emailVerified = true;
    }

    if (Object.keys(updates).length > 0) {
      await this.usersService.updateCurrentUser(user.id, updates);
    }

    return {
      message: 'Verification completed successfully',
      verified: Object.keys(updates)
    };
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Complete onboarding',
    description: 'Mark onboarding as completed and set any final information'
  })
  @ApiBody({ type: CompleteOnboardingDto })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  async completeOnboarding(
    @GetUser() user: any,
    @Body() completionData: CompleteOnboardingDto
  ): Promise<any> {
    // Update any additional fields
    if (completionData.address || completionData.profileImage) {
      await this.usersService.updateCurrentUser(user.id, {
        address: completionData.address,
        profileImage: completionData.profileImage,
        identityVerified: true // Mark identity as verified upon completion
      });
    }

    return {
      message: 'Onboarding completed successfully!',
      completed: true,
      userId: user.id
    };
  }

  private getNextStep(completedSteps: string[]): string {
    const steps = ['location', 'personal', 'preferences', 'verification'];

    for (const step of steps) {
      if (!completedSteps.includes(step)) {
        return step;
      }
    }

    return 'complete';
  }
}

