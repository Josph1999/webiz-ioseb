import { Injectable } from '@nestjs/common';
import { IConversionStrategy } from './conversion-strategy.interface';
import { Currency } from '../value-objects/currency.vo';
import { ExchangeRate } from '../entities/exchange-rate.entity';

@Injectable()
export class DirectConversionStrategy implements IConversionStrategy {
  convert(
    amount: number,
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: ExchangeRate[],
  ): number {
    if (sourceCurrency.equals(targetCurrency)) {
      return amount;
    }

    const rate = this.findRate(sourceCurrency, targetCurrency, rates);
    if (!rate) {
      throw new Error('Exchange rate not found');
    }

    return amount * rate.getRate();
  }

  canConvert(
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: ExchangeRate[],
  ): boolean {
    if (sourceCurrency.equals(targetCurrency)) {
      return true;
    }

    return !!this.findRate(sourceCurrency, targetCurrency, rates);
  }

  private findRate(
    sourceCurrency: Currency,
    targetCurrency: Currency,
    rates: ExchangeRate[],
  ): ExchangeRate | null {
    const directRate = rates.find(
      (r) =>
        r.currencyCodeA === sourceCurrency.numericCode &&
        r.currencyCodeB === targetCurrency.numericCode,
    );

    if (directRate) {
      return directRate;
    }

    const inverseRate = rates.find(
      (r) =>
        r.currencyCodeA === targetCurrency.numericCode &&
        r.currencyCodeB === sourceCurrency.numericCode,
    );

    if (inverseRate) {
      const rate = inverseRate.getRate();
      return new ExchangeRate(
        sourceCurrency.numericCode,
        targetCurrency.numericCode,
        inverseRate.date,
        inverseRate.rateSell ? 1 / inverseRate.rateSell : undefined,
        inverseRate.rateBuy ? 1 / inverseRate.rateBuy : undefined,
        rate ? 1 / rate : undefined,
      );
    }

    return null;
  }
}
