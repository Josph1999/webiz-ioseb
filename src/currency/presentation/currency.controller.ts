import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrencyConversionService } from '../application/currency-conversion.service';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { CurrencyConversionResultDto } from '../dto/currency-conversion-result.dto';

@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyConversionService: CurrencyConversionService,
  ) {}

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async convertCurrency(
    @Body() convertCurrencyDto: ConvertCurrencyDto,
  ): Promise<CurrencyConversionResultDto> {
    return await this.currencyConversionService.convertCurrency(
      convertCurrencyDto,
    );
  }
}
