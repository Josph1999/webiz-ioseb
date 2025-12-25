import { Currency } from '../value-objects/currency.vo';
import { ExchangeRate } from '../entities/exchange-rate.entity';

export interface IConversionStrategy {
  convert(
    amount: number,
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: ExchangeRate[],
  ): number;
  canConvert(
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: ExchangeRate[],
  ): boolean;
}
