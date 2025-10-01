import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryListQueryDto,
  BulkImportResultDto,
  CountryCsvRowDto,
} from '../dtos/country.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCountryDto: CreateCountryDto) {
    // Check for unique constraints
    const existingByName = await this.prisma.country.findUnique({
      where: { name: createCountryDto.name },
    });
    if (existingByName) {
      throw new ConflictException(
        `Country with name "${createCountryDto.name}" already exists`,
      );
    }

    const existingByIso2 = await this.prisma.country.findUnique({
      where: { isoCode2: createCountryDto.isoCode2 },
    });
    if (existingByIso2) {
      throw new ConflictException(
        `Country with ISO code "${createCountryDto.isoCode2}" already exists`,
      );
    }

    if (createCountryDto.isoCode3) {
      const existingByIso3 = await this.prisma.country.findUnique({
        where: { isoCode3: createCountryDto.isoCode3 },
      });
      if (existingByIso3) {
        throw new ConflictException(
          `Country with ISO3 code "${createCountryDto.isoCode3}" already exists`,
        );
      }
    }

    if (createCountryDto.numericCode) {
      const existingByNumeric = await this.prisma.country.findUnique({
        where: { numericCode: createCountryDto.numericCode },
      });
      if (existingByNumeric) {
        throw new ConflictException(
          `Country with numeric code "${createCountryDto.numericCode}" already exists`,
        );
      }
    }

    const country = await this.prisma.country.create({
      data: {
        name: createCountryDto.name,
        isoCode2: createCountryDto.isoCode2,
        isoCode3: createCountryDto.isoCode3,
        numericCode: createCountryDto.numericCode,
        phoneCode: createCountryDto.phoneCode,
        currencyCode: createCountryDto.currencyCode,
        currencyName: createCountryDto.currencyName,
        currencySymbol: createCountryDto.currencySymbol,
        timezone: createCountryDto.timezone,
        continent: createCountryDto.continent,
        region: createCountryDto.region,
        subregion: createCountryDto.subregion,
        vatRate: createCountryDto.vatRate,
        corporateTaxRate: createCountryDto.corporateTaxRate,
        incomeTaxRate: createCountryDto.incomeTaxRate,
        isActive: createCountryDto.isActive ?? true,
        requiresVerification: createCountryDto.requiresVerification ?? false,
        supportedLanguages: createCountryDto.supportedLanguages || undefined,
        legalRequirements: createCountryDto.legalRequirements || undefined,
        businessHours: createCountryDto.businessHours || undefined,
        publicHolidays: createCountryDto.publicHolidays || undefined,
        timeRestrictions: createCountryDto.timeRestrictions || undefined,
        regionalSettings: createCountryDto.regionalSettings || undefined,
        flag: createCountryDto.flag,
        capital: createCountryDto.capital,
        population: createCountryDto.population,
        areaKm2: createCountryDto.areaKm2,
      },
    });

    this.logger.log(`Country created: ${country.name} (${country.isoCode2})`);

    return this.transformCountry(country);
  }

  async findAll(query: CountryListQueryDto) {
    const {
      search,
      continent,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { isoCode2: { contains: search, mode: 'insensitive' } },
        { isoCode3: { contains: search, mode: 'insensitive' } },
        { capital: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Continent filter
    if (continent) {
      where.continent = continent;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const total = await this.prisma.country.count({ where });

    const countries = await this.prisma.country.findMany({
      where,
      select: {
        id: true,
        name: true,
        isoCode2: true,
        continent: true,
        isActive: true,
        _count: {
          select: {
            states: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      countries: countries.map((country) =>
        this.transformCountryListItem(country),
      ),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            states: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return this.transformCountryWithCount(country);
  }

  async update(id: number, updateCountryDto: UpdateCountryDto) {
    // Check if country exists
    const existingCountry = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!existingCountry) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check unique constraints only if values are being changed
    if (
      updateCountryDto.name &&
      updateCountryDto.name !== existingCountry.name
    ) {
      const existingByName = await this.prisma.country.findUnique({
        where: { name: updateCountryDto.name },
      });
      if (existingByName) {
        throw new ConflictException(
          `Country with name "${updateCountryDto.name}" already exists`,
        );
      }
    }

    if (
      updateCountryDto.isoCode2 &&
      updateCountryDto.isoCode2 !== existingCountry.isoCode2
    ) {
      const existingByIso2 = await this.prisma.country.findUnique({
        where: { isoCode2: updateCountryDto.isoCode2 },
      });
      if (existingByIso2) {
        throw new ConflictException(
          `Country with ISO code "${updateCountryDto.isoCode2}" already exists`,
        );
      }
    }

    if (
      updateCountryDto.isoCode3 &&
      updateCountryDto.isoCode3 !== existingCountry.isoCode3
    ) {
      const existingByIso3 = await this.prisma.country.findUnique({
        where: { isoCode3: updateCountryDto.isoCode3 },
      });
      if (existingByIso3) {
        throw new ConflictException(
          `Country with ISO3 code "${updateCountryDto.isoCode3}" already exists`,
        );
      }
    }

    if (
      updateCountryDto.numericCode &&
      updateCountryDto.numericCode !== existingCountry.numericCode
    ) {
      const existingByNumeric = await this.prisma.country.findUnique({
        where: { numericCode: updateCountryDto.numericCode },
      });
      if (existingByNumeric) {
        throw new ConflictException(
          `Country with numeric code "${updateCountryDto.numericCode}" already exists`,
        );
      }
    }

    const updatedCountry = await this.prisma.country.update({
      where: { id },
      data: {
        name: updateCountryDto.name,
        isoCode2: updateCountryDto.isoCode2,
        isoCode3: updateCountryDto.isoCode3,
        numericCode: updateCountryDto.numericCode,
        phoneCode: updateCountryDto.phoneCode,
        currencyCode: updateCountryDto.currencyCode,
        currencyName: updateCountryDto.currencyName,
        currencySymbol: updateCountryDto.currencySymbol,
        timezone: updateCountryDto.timezone,
        continent: updateCountryDto.continent,
        region: updateCountryDto.region,
        subregion: updateCountryDto.subregion,
        vatRate: updateCountryDto.vatRate,
        corporateTaxRate: updateCountryDto.corporateTaxRate,
        incomeTaxRate: updateCountryDto.incomeTaxRate,
        isActive: updateCountryDto.isActive,
        requiresVerification: updateCountryDto.requiresVerification,
        supportedLanguages: updateCountryDto.supportedLanguages || undefined,
        legalRequirements: updateCountryDto.legalRequirements || undefined,
        businessHours: updateCountryDto.businessHours || undefined,
        publicHolidays: updateCountryDto.publicHolidays || undefined,
        timeRestrictions: updateCountryDto.timeRestrictions || undefined,
        regionalSettings: updateCountryDto.regionalSettings || undefined,
        flag: updateCountryDto.flag,
        capital: updateCountryDto.capital,
        population: updateCountryDto.population,
        areaKm2: updateCountryDto.areaKm2,
      },
    });

    this.logger.log(
      `Country updated: ${updatedCountry.name} (${updatedCountry.isoCode2})`,
    );

    return this.transformCountry(updatedCountry);
  }

  async remove(id: number) {
    // Check if country exists
    const country = await this.prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            states: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check if country has states (can't delete if it has dependencies)
    if (country._count.states > 0) {
      throw new ConflictException(
        `Cannot delete country "${country.name}" because it has ${country._count.states} associated states`,
      );
    }

    await this.prisma.country.delete({
      where: { id },
    });

    this.logger.log(`Country deleted: ${country.name} (${country.isoCode2})`);

    return { message: 'Country deleted successfully' };
  }

  async getContinents() {
    const continents = await this.prisma.country.findMany({
      select: {
        continent: true,
      },
      distinct: ['continent'],
      orderBy: {
        continent: 'asc',
      },
    });

    return continents.map((c) => c.continent);
  }

  async getCountriesByContinent() {
    const result = await this.prisma.country.groupBy({
      by: ['continent'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        continent: 'asc',
      },
    });

    return result.map((item) => ({
      continent: item.continent,
      count: item._count.id,
    }));
  }

  async toggleActiveStatus(id: number) {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    const updatedCountry = await this.prisma.country.update({
      where: { id },
      data: {
        isActive: !country.isActive,
      },
    });

    this.logger.log(
      `Country ${country.name} status changed to: ${updatedCountry.isActive ? 'active' : 'inactive'}`,
    );

    return this.transformCountry(updatedCountry);
  }

  private transformCountry(country: any) {
    return {
      ...country,
      vatRate: country.vatRate ? Number(country.vatRate) : null,
      corporateTaxRate: country.corporateTaxRate
        ? Number(country.corporateTaxRate)
        : null,
      incomeTaxRate: country.incomeTaxRate
        ? Number(country.incomeTaxRate)
        : null,
      population: country.population ? Number(country.population) : null,
      areaKm2: country.areaKm2 ? Number(country.areaKm2) : null,
    };
  }

  private transformCountryWithCount(country: any) {
    return {
      ...this.transformCountry(country),
      statesCount: country._count?.states || 0,
      _count: undefined,
    };
  }

  private transformCountryListItem(country: any) {
    return {
      id: country.id,
      name: country.name,
      isoCode2: country.isoCode2,
      continent: country.continent,
      isActive: country.isActive,
      statesCount: country._count?.states || 0,
    };
  }

  async bulkImportCsv(csvBuffer: Buffer): Promise<BulkImportResultDto> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const results: CountryCsvRowDto[] = [];
      const errors: Array<{
        row: number;
        field?: string;
        value?: string;
        error: string;
      }> = [];
      const skippedRecords: Array<{
        row: number;
        field?: string;
        value?: string;
        reason: string;
        data: any;
      }> = [];

      let rowNumber = 1; // Start from 1 (header is row 0)

      const stream = Readable.from(csvBuffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => {
          rowNumber++;
          results.push(data);
        })
        .on('error', (error) => {
          this.logger.error('Error parsing CSV file:', error);
          reject(new Error(`Error parsing CSV file: ${error.message}`));
        })
        .on('end', async () => {
          try {
            const importResult = await this.processBulkImport(
              results,
              errors,
              skippedRecords,
            );
            importResult.duration = Date.now() - startTime;
            resolve(importResult);
          } catch (error) {
            this.logger.error('Error processing bulk import:', error);
            reject(error);
          }
        });
    });
  }

  private async processBulkImport(
    csvRows: CountryCsvRowDto[],
    errors: Array<{
      row: number;
      field?: string;
      value?: string;
      error: string;
    }>,
    skippedRecords: Array<{
      row: number;
      field?: string;
      value?: string;
      reason: string;
      data: any;
    }>,
  ): Promise<BulkImportResultDto> {
    let successful = 0;
    let skipped = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    const batches: CountryCsvRowDto[][] = [];

    for (let i = 0; i < csvRows.length; i += batchSize) {
      batches.push(csvRows.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchPromises = batch.map((row, indexInBatch) => {
        const rowNumber = batchIndex * batchSize + indexInBatch + 2; // +2 because header is row 1, data starts at row 2
        return this.processCountryRow(row, rowNumber, errors, skippedRecords);
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value === 'success') {
            successful++;
          } else if (result.value === 'skipped') {
            skipped++;
          }
        } else {
          failed++;
          // Error already logged in processCountryRow
        }
      });
    }

    this.logger.log(
      `Bulk import completed: ${successful} successful, ${skipped} skipped, ${failed} failed`,
    );

    return {
      totalProcessed: csvRows.length,
      successful,
      failed,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      skippedRecords: skippedRecords.length > 0 ? skippedRecords : undefined,
      duration: 0, // Will be set by the calling method
    };
  }

  private async processCountryRow(
    row: CountryCsvRowDto,
    rowNumber: number,
    errors: Array<{
      row: number;
      field?: string;
      value?: string;
      error: string;
    }>,
    skippedRecords: Array<{
      row: number;
      field?: string;
      value?: string;
      reason: string;
      data: any;
    }>,
  ): Promise<'success' | 'skipped' | 'failed'> {
    try {
      // Validate required fields
      if (
        !row.name ||
        !row.isoCode2 ||
        !row.currencyCode ||
        !row.timezone ||
        !row.continent
      ) {
        errors.push({
          row: rowNumber,
          error:
            'Missing required fields: name, isoCode2, currencyCode, timezone, continent are required',
        });
        return 'failed';
      }

      // Check for duplicates
      const existingByName = await this.prisma.country.findUnique({
        where: { name: row.name },
      });
      if (existingByName) {
        skippedRecords.push({
          row: rowNumber,
          reason: `Country with name "${row.name}" already exists`,
          data: row,
        });
        return 'skipped';
      }

      const existingByIso2 = await this.prisma.country.findUnique({
        where: { isoCode2: row.isoCode2 },
      });
      if (existingByIso2) {
        skippedRecords.push({
          row: rowNumber,
          reason: `Country with ISO code "${row.isoCode2}" already exists`,
          data: row,
        });
        return 'skipped';
      }

      // Parse numeric fields
      let vatRate: number | null = null;
      let corporateTaxRate: number | null = null;
      let incomeTaxRate: number | null = null;
      let population: bigint | null = null;
      let areaKm2: number | null = null;
      let numericCode: number | null = null;

      if (row.vatRate) {
        const parsed = parseFloat(row.vatRate);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          vatRate = parsed;
        } else {
          errors.push({
            row: rowNumber,
            field: 'vatRate',
            value: row.vatRate,
            error: 'VAT rate must be a number between 0 and 100',
          });
          return 'failed';
        }
      }

      if (row.corporateTaxRate) {
        const parsed = parseFloat(row.corporateTaxRate);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          corporateTaxRate = parsed;
        } else {
          errors.push({
            row: rowNumber,
            field: 'corporateTaxRate',
            value: row.corporateTaxRate,
            error: 'Corporate tax rate must be a number between 0 and 100',
          });
          return 'failed';
        }
      }

      if (row.incomeTaxRate) {
        const parsed = parseFloat(row.incomeTaxRate);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          incomeTaxRate = parsed;
        } else {
          errors.push({
            row: rowNumber,
            field: 'incomeTaxRate',
            value: row.incomeTaxRate,
            error: 'Income tax rate must be a number between 0 and 100',
          });
          return 'failed';
        }
      }

      if (row.population) {
        const parsed = parseInt(row.population);
        if (!isNaN(parsed) && parsed >= 0) {
          population = BigInt(parsed);
        } else {
          errors.push({
            row: rowNumber,
            field: 'population',
            value: row.population,
            error: 'Population must be a positive integer',
          });
          return 'failed';
        }
      }

      if (row.areaKm2) {
        const parsed = parseFloat(row.areaKm2);
        if (!isNaN(parsed) && parsed >= 0) {
          areaKm2 = parsed;
        } else {
          errors.push({
            row: rowNumber,
            field: 'areaKm2',
            value: row.areaKm2,
            error: 'Area must be a positive number',
          });
          return 'failed';
        }
      }

      if (row.numericCode) {
        const parsed = parseInt(row.numericCode);
        if (!isNaN(parsed) && parsed >= 0) {
          numericCode = parsed;
        } else {
          errors.push({
            row: rowNumber,
            field: 'numericCode',
            value: row.numericCode,
            error: 'Numeric code must be a positive integer',
          });
          return 'failed';
        }
      }

      // Parse supported languages
      let supportedLanguages: string[] | null = null;
      if (row.supportedLanguages) {
        supportedLanguages = row.supportedLanguages
          .split(',')
          .map((lang) => lang.trim())
          .filter((lang) => lang.length > 0);
      }

      // Create the country
      await this.prisma.country.create({
        data: {
          name: row.name,
          isoCode2: row.isoCode2,
          isoCode3: row.isoCode3 || null,
          numericCode,
          phoneCode: row.phoneCode || null,
          currencyCode: row.currencyCode,
          currencyName: row.currencyName || null,
          currencySymbol: row.currencySymbol || null,
          timezone: row.timezone,
          continent: row.continent,
          region: row.region || null,
          subregion: row.subregion || null,
          vatRate,
          corporateTaxRate,
          incomeTaxRate,
          isActive: true,
          requiresVerification: false,
          supportedLanguages: supportedLanguages || undefined,
          legalRequirements: undefined,
          flag: row.flag || null,
          capital: row.capital || null,
          population,
          areaKm2,
        },
      });

      return 'success';
    } catch (error) {
      this.logger.error(`Error processing row ${rowNumber}:`, error);
      errors.push({
        row: rowNumber,
        error: error.message || 'Unknown error occurred',
      });
      return 'failed';
    }
  }
}
