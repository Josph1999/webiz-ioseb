# Currency Conversion API

A NestJS backend application for converting currencies using real-time exchange rates from Monobank API.

## Features

- Real-time currency conversion
- Redis caching (stores rates for 5 minutes)
- Automatic retry if API fails
- Input validation
- Error handling

## Supported Currencies

- UAH (Ukrainian Hryvnia)
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- CHF (Swiss Franc)
- PLN (Polish Zloty)
- CZK (Czech Koruna)

### Repository Pattern
Separates database/cache access from business logic. Makes it easy to switch between Redis, MongoDB, or other storage without changing the main code.

### Strategy Pattern
Different ways to convert currency:
- **Direct conversion**: USD → EUR (finds direct rate)
- **Cross-rate conversion**: EUR → GBP through UAH (EUR → UAH → GBP)

### Domain-Driven Design (DDD)
Code is organized into layers:
- **Domain**: Core business rules (entities, value objects)
- **Application**: Business logic (services)
- **Infrastructure**: External services (API, Redis, database)
- **Presentation**: HTTP endpoints (controllers)

## Quick Start with Docker

### 1. Start the application
```bash
# Development (with hot-reload)
yarn docker:dev
```

The API will be available at `http://localhost:3000`

### 2. Stop the application
```bash
yarn docker:dev:down
```

That's it! Docker will automatically:
- Install all dependencies
- Start the Node.js app
- Start Redis cache
- Connect everything together

## Run Without Docker (Local Setup)

1. Install dependencies
```bash
yarn install
```

2. Start Redis
```bash
docker-compose up -d redis
```

3. Copy `.env.example` to `.env`
```bash
cp .env.example .env
```

4. Start the app
```bash
yarn start:dev
```

Open `http://localhost:3000`

## API Endpoint

### Convert Currency
**POST** `/currency/convert`

**Request Body:**
```json
{
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "amount": 100
}
```

**Response:**
```json
{
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 100,
  "convertedAmount": 92.50,
  "exchangeRate": 0.925,
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

## Testing the API

```bash
curl -X POST http://localhost:3000/currency/convert \
  -H "Content-Type: application/json" \
  -d '{"sourceCurrency": "USD", "targetCurrency": "EUR", "amount": 100}'
```

## What's Running in Docker?

When you run `yarn docker:dev`, Docker starts:

1. **Node.js app** (port 3000)
   - Your NestJS application
   - Auto-reloads when you change code

2. **Redis** (port 6379)
   - Stores exchange rates
   - Saves data even if you restart

## How It Works

1. **You send request** → API receives currency conversion request
2. **Check cache** → Looks for rates in Redis (fast)
3. **If not in cache** → Fetches fresh rates from Monobank API
4. **Save to cache** → Stores rates for 5 minutes
5. **Convert** → Calculates conversion using appropriate strategy
6. **Return result** → Sends converted amount back

## What Happens if Monobank API Fails?

- **Retry**: Automatically retries up to 3 times
- **Cache**: Uses cached rates if available
- **Error**: Returns clear error message if everything fails

## Technologies

- NestJS 11
- TypeScript
- Redis (cache-manager-redis-yet)
- Axios (HTTP client)
- class-validator (DTO validation)
- RxJS (reactive programming)
