import { ExchangeRate } from '../entities/exchange-rate.entity';

export interface IExchangeRateRepository {
  findAll(): Promise<ExchangeRate[]>;
  findByCurrencyPair(
    currencyCodeA: number,
    currencyCodeB: number,
  ): Promise<ExchangeRate | null>;
  save(rates: ExchangeRate[]): Promise<void>;
  clear(): Promise<void>;
}

export const EXCHANGE_RATE_REPOSITORY = Symbol('IExchangeRateRepository');
