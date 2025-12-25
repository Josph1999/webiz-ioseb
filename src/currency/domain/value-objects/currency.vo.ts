export class Currency {
  private static readonly CURRENCY_CODES = new Map<string, number>([
    ['UAH', 980],
    ['USD', 840],
    ['EUR', 978],
    ['GBP', 826],
    ['CHF', 756],
    ['PLN', 985],
    ['CZK', 203],
  ]);

  private constructor(
    public readonly code: string,
    public readonly numericCode: number,
  ) {}

  static fromCode(code: string): Currency {
    const upperCode = code.toUpperCase();
    const numericCode = this.CURRENCY_CODES.get(upperCode);

    if (!numericCode) {
      throw new Error(`Unsupported currency code: ${code}`);
    }

    return new Currency(upperCode, numericCode);
  }

  static fromNumericCode(numericCode: number): Currency {
    for (const [code, numeric] of this.CURRENCY_CODES.entries()) {
      if (numeric === numericCode) {
        return new Currency(code, numeric);
      }
    }
    throw new Error(`Unsupported numeric currency code: ${numericCode}`);
  }

  equals(other: Currency): boolean {
    return this.numericCode === other.numericCode;
  }
}
