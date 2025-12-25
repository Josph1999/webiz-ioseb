import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, retry, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';

interface MonobankExchangeRateResponse {
  currencyCodeA: number;
  currencyCodeB: number;
  date: number;
  rateBuy?: number;
  rateSell?: number;
  rateCross?: number;
}

@Injectable()
export class MonobankApiService {
  private readonly logger = new Logger(MonobankApiService.name);
  private readonly apiUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000;
  private lastFailureTime: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl =
      this.configService.get('CURRENCY_API_URL') ||
      'https://api.monobank.ua/bank/currency';
    this.maxRetries = this.configService.get('API_MAX_RETRIES', 3);
    this.retryDelay = this.configService.get('API_RETRY_DELAY', 1000);
  }

  async fetchExchangeRates(): Promise<ExchangeRate[]> {
    this.checkCircuitBreaker();

    try {
      this.logger.log('Fetching exchange rates from Monobank API');

      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl).pipe(
          retry({
            count: this.maxRetries,
            delay: (error: unknown, retryCount) => {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.warn(
                `Retry attempt ${retryCount} after error: ${errorMessage}`,
              );
              return timer(this.retryDelay * retryCount);
            },
          }),
          catchError((error: unknown) => {
            this.handleFailure();

            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to fetch exchange rates', errorMessage);

            if (
              typeof error === 'object' &&
              error !== null &&
              'response' in error
            ) {
              const axiosError = error as {
                response: { statusText: string; status: number };
              };
              throw new HttpException(
                `Monobank API error: ${axiosError.response.statusText}`,
                axiosError.response.status,
              );
            }

            throw new HttpException(
              'Failed to fetch exchange rates from external API',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );

      this.handleSuccess();
      const rates = (response.data as MonobankExchangeRateResponse[]).map(
        (item) => ExchangeRate.fromApiResponse(item),
      );

      this.logger.log(`Successfully fetched ${rates.length} exchange rates`);
      return rates;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }

  private checkCircuitBreaker(): void {
    if (this.circuitBreakerState === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.recoveryTimeout) {
        this.logger.log('Circuit breaker moving to HALF_OPEN state');
        this.circuitBreakerState = 'HALF_OPEN';
      } else {
        this.logger.error('Circuit breaker is OPEN, rejecting request');
        throw new HttpException(
          'Service temporarily unavailable due to multiple failures',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }

  private handleSuccess(): void {
    this.failureCount = 0;
    if (this.circuitBreakerState === 'HALF_OPEN') {
      this.logger.log('Circuit breaker moving to CLOSED state');
      this.circuitBreakerState = 'CLOSED';
    }
  }

  private handleFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.logger.error(
        `Circuit breaker OPEN after ${this.failureCount} failures`,
      );
      this.circuitBreakerState = 'OPEN';
    }
  }

  getCircuitBreakerState(): string {
    return this.circuitBreakerState;
  }
}
