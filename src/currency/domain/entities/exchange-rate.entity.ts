interface ExchangeRateApiResponse {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

export class ExchangeRate {
  constructor(
    public readonly currencyCodeA: number,
    public readonly currencyCodeB: number,
    public readonly date: number,
    public readonly rateBuy?: number,
    public readonly rateSell?: number,
    public readonly rateCross?: number,
  ) {}

  static fromApiResponse(data: ExchangeRateApiResponse): ExchangeRate {
    return new ExchangeRate(
      data.currencyCodeA,
      data.currencyCodeB,
      data.date,
      data.rateBuy,
      data.rateSell,
      data.rateCross,
    );
  }

  getRate(): number {
    return this.rateCross ?? this.rateBuy ?? this.rateSell ?? 1;
  }
}
