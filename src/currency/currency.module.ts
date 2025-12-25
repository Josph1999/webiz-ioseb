import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CurrencyController } from './presentation/currency.controller';
import { CurrencyConversionService } from './application/currency-conversion.service';
import { MonobankApiService } from './infrastructure/api/monobank-api.service';
import { ExchangeRateCacheRepository } from './infrastructure/repositories/exchange-rate-cache.repository';
import { DirectConversionStrategy } from './domain/strategies/direct-conversion.strategy';
import { CrossRateConversionStrategy } from './domain/strategies/cross-rate-conversion.strategy';
import { EXCHANGE_RATE_REPOSITORY } from './domain/repositories/exchange-rate.repository.interface';
import { CacheConfig } from './infrastructure/cache/cache.config';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useClass: CacheConfig,
    }),
  ],
  controllers: [CurrencyController],
  providers: [
    CurrencyConversionService,
    MonobankApiService,
    DirectConversionStrategy,
    CrossRateConversionStrategy,
    {
      provide: EXCHANGE_RATE_REPOSITORY,
      useClass: ExchangeRateCacheRepository,
    },
  ],
  exports: [CurrencyConversionService],
})
export class CurrencyModule {}
