import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { IExchangeRateRepository } from '../../domain/repositories/exchange-rate.repository.interface';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

@Injectable()
export class ExchangeRateCacheRepository implements IExchangeRateRepository {
  private readonly CACHE_KEY = 'exchange_rates';
  private readonly CACHE_TTL: number;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10) * 1000;
  }

  async findAll(): Promise<ExchangeRate[]> {
    const cached = await this.cacheManager.get<ExchangeRate[]>(this.CACHE_KEY);
    return cached || [];
  }

  async findByCurrencyPair(
    currencyCodeA: number,
    currencyCodeB: number,
  ): Promise<ExchangeRate | null> {
    const rates = await this.findAll();

    const directRate = rates.find(
      (r) =>
        r.currencyCodeA === currencyCodeA && r.currencyCodeB === currencyCodeB,
    );

    if (directRate) {
      return directRate;
    }

    const inverseRate = rates.find(
      (r) =>
        r.currencyCodeA === currencyCodeB && r.currencyCodeB === currencyCodeA,
    );

    if (inverseRate) {
      const rate = inverseRate.getRate();
      return new ExchangeRate(
        currencyCodeA,
        currencyCodeB,
        inverseRate.date,
        inverseRate.rateSell ? 1 / inverseRate.rateSell : undefined,
        inverseRate.rateBuy ? 1 / inverseRate.rateBuy : undefined,
        rate ? 1 / rate : undefined,
      );
    }

    return null;
  }

  async save(rates: ExchangeRate[]): Promise<void> {
    await this.cacheManager.set(this.CACHE_KEY, rates, this.CACHE_TTL);
  }

  async clear(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY);
  }
}
