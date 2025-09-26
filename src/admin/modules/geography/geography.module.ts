import { Module } from '@nestjs/common';

// Controllers
import { CountriesController } from './controllers/countries.controller';
import { StatesController } from './controllers/states.controller';
import { CitiesController } from './controllers/cities.controller';
import { ServiceZonesController } from './controllers/service-zones.controller';

// Services
import { CountriesService } from './services/countries.service';
import { StatesService } from './services/states.service';
import { CitiesService } from './services/cities.service';
import { ServiceZonesService } from './services/service-zones.service';

// Prisma
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    CountriesController,
    StatesController,
    CitiesController,
    ServiceZonesController,
  ],
  providers: [
    CountriesService,
    StatesService,
    CitiesService,
    ServiceZonesService,
  ],
  exports: [
    CountriesService,
    StatesService,
    CitiesService,
    ServiceZonesService,
  ],
})
export class GeographyModule {}
