import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Currency } from '../domain/value-objects/currency.vo';
import type { IConversionStrategy } from '../domain/strategies/conversion-strategy.interface';
import { DirectConversionStrategy } from '../domain/strategies/direct-conversion.strategy';
import { CrossRateConversionStrategy } from '../domain/strategies/cross-rate-conversion.strategy';
import type { IExchangeRateRepository } from '../domain/repositories/exchange-rate.repository.interface';
import { EXCHANGE_RATE_REPOSITORY } from '../domain/repositories/exchange-rate.repository.interface';
import { MonobankApiService } from '../infrastructure/api/monobank-api.service';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { CurrencyConversionResultDto } from '../dto/currency-conversion-result.dto';

@Injectable()
export class CurrencyConversionService {
  private readonly logger = new Logger(CurrencyConversionService.name);
  private readonly strategies: IConversionStrategy[];

  constructor(
    @Inject(EXCHANGE_RATE_REPOSITORY)
    private readonly exchangeRateRepository: IExchangeRateRepository,
    private readonly monobankApiService: MonobankApiService,
    private readonly directConversionStrategy: DirectConversionStrategy,
    private readonly crossRateConversionStrategy: CrossRateConversionStrategy,
  ) {
    this.strategies = [
      this.directConversionStrategy,
      this.crossRateConversionStrategy,
    ];
  }

  async convertCurrency(
    dto: ConvertCurrencyDto,
  ): Promise<CurrencyConversionResultDto> {
    this.logger.log(
      `Converting ${dto.amount} ${dto.sourceCurrency} to ${dto.targetCurrency}`,
    );

    let sourceCurrency: Currency;
    let targetCurrency: Currency;

    try {
      sourceCurrency = Currency.fromCode(dto.sourceCurrency);
      targetCurrency = Currency.fromCode(dto.targetCurrency);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid currency code',
      );
    }

    await this.ensureExchangeRatesAvailable();

    const rates = await this.exchangeRateRepository.findAll();

    const strategy = this.selectStrategy(sourceCurrency, targetCurrency, rates);

    if (!strategy) {
      throw new BadRequestException(
        `Cannot convert from ${dto.sourceCurrency} to ${dto.targetCurrency}`,
      );
    }

    const convertedAmount = strategy.convert(
      dto.amount,
      sourceCurrency,
      targetCurrency,
      rates,
    );

    const exchangeRate = dto.amount !== 0 ? convertedAmount / dto.amount : 0;

    this.logger.log(
      `Conversion successful: ${dto.amount} ${dto.sourceCurrency} = ${convertedAmount} ${dto.targetCurrency}`,
    );

    return new CurrencyConversionResultDto(
      dto.sourceCurrency,
      dto.targetCurrency,
      dto.amount,
      parseFloat(convertedAmount.toFixed(2)),
      parseFloat(exchangeRate.toFixed(6)),
    );
  }

  private async ensureExchangeRatesAvailable(): Promise<void> {
    const cachedRates = await this.exchangeRateRepository.findAll();

    if (cachedRates.length === 0) {
      this.logger.log('Cache miss, fetching fresh rates from API');
      const freshRates = await this.monobankApiService.fetchExchangeRates();
      await this.exchangeRateRepository.save(freshRates);
    } else {
      this.logger.log('Using cached exchange rates');
    }
  }

  private selectStrategy(
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: any[],
  ): IConversionStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.canConvert(sourceCurrency, targetCurrency, rates)) {
        this.logger.log(`Selected strategy: ${strategy.constructor.name}`);
        return strategy;
      }
    }
    return null;
  }
}
