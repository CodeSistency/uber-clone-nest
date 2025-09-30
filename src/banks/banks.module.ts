import { Module } from '@nestjs/common';
import { BanksService } from './banks.service';
import { BancoVenezuelaApi } from './mock-bank-apis/banco-venezuela.api';
import { MercantilApi } from './mock-bank-apis/mercantil.api';
import { BNCApi } from './mock-bank-apis/bnc.api';
import { ProvincialApi } from './mock-bank-apis/provincial.api';

@Module({
  providers: [
    BanksService,
    BancoVenezuelaApi,
    MercantilApi,
    BNCApi,
    ProvincialApi,
  ],
  exports: [BanksService],
})
export class BanksModule {}
