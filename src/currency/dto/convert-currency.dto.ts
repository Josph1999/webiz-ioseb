import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  @IsNotEmpty()
  sourceCurrency: string;

  @IsString()
  @IsNotEmpty()
  targetCurrency: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
