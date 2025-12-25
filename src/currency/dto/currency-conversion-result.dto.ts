export class CurrencyConversionResultDto {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  timestamp: Date;

  constructor(
    sourceCurrency: string,
    targetCurrency: string,
    sourceAmount: number,
    convertedAmount: number,
    exchangeRate: number,
  ) {
    this.sourceCurrency = sourceCurrency;
    this.targetCurrency = targetCurrency;
    this.sourceAmount = sourceAmount;
    this.convertedAmount = convertedAmount;
    this.exchangeRate = exchangeRate;
    this.timestamp = new Date();
  }
}
