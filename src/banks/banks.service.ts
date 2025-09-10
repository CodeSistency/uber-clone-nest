import { Injectable } from '@nestjs/common';
import { BankApiInterface, BankInfo } from '../payments/interfaces/bank-api.interface';
import { BancoVenezuelaApi } from './mock-bank-apis/banco-venezuela.api';
import { MercantilApi } from './mock-bank-apis/mercantil.api';
import { BNCApi } from './mock-bank-apis/bnc.api';
import { ProvincialApi } from './mock-bank-apis/provincial.api';

@Injectable()
export class BanksService {
  private bankApis: Map<string, BankApiInterface> = new Map();

  constructor(
    bancoVenezuelaApi: BancoVenezuelaApi,
    mercantilApi: MercantilApi,
    bncApi: BNCApi,
    provincialApi: ProvincialApi,
  ) {
    // Registrar APIs bancarias simuladas
    this.bankApis.set('0102', bancoVenezuelaApi);
    this.bankApis.set('0105', mercantilApi);
    this.bankApis.set('0196', bncApi);
    this.bankApis.set('0108', provincialApi);
  }

  getBankApi(bankCode: string): BankApiInterface {
    const api = this.bankApis.get(bankCode);
    if (!api) {
      throw new Error(`Banco no soportado: ${bankCode}. Bancos disponibles: ${Array.from(this.bankApis.keys()).join(', ')}`);
    }
    return api;
  }

  getSupportedBanks(): BankInfo[] {
    const banks: BankInfo[] = [];

    for (const [code, api] of this.bankApis.entries()) {
      banks.push(api.getBankInfo());
    }

    return banks;
  }

  async validateBankCode(bankCode: string): Promise<boolean> {
    return this.bankApis.has(bankCode);
  }

  getBankInfo(bankCode: string): BankInfo | null {
    try {
      const api = this.getBankApi(bankCode);
      return api.getBankInfo();
    } catch {
      return null;
    }
  }
}
