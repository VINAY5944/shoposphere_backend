# ShopSphere Backend

ShopSphere is a modular e-commerce REST API built with Node.js and Express. It provides customer and admin workflows for authentication, product catalog management, carts, checkout, orders, inventory, and notifications. The repository currently contains the backend and its local development infrastructure.

## Features

- JWT authentication with separate customer and admin login flows
- Role-protected admin and customer routes
- Product and category management, including product image uploads
- Cart management and checkout for cart or direct purchase
- PostgreSQL transactions for order creation and stock changes
- Inventory restocking and per-product stock movement history
- Cursor pagination for product and inventory history listings
- Asynchronous order confirmation email jobs using BullMQ and Redis
- Persistence of terminally failed notification jobs
- Database migrations and role/permission seeders

Payments are simulated using a configured test password; this project does not integrate with a real payment gateway. Email delivery uses configurable SMTP. Queue completion means the SMTP provider accepted the message, not that the recipient received it.

## Technology

- Node.js 22, Express 5, JavaScript ES modules
- PostgreSQL 17 with Sequelize and Umzug migrations
- Redis 7 and BullMQ for background email jobs
- Nodemailer for SMTP
- Docker Compose for local development

## Project layout

```text
shopsphere/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature/domain modules
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── inventory/
│   │   │   ├── notifications/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── products/
│   │   │   └── users/
│   │   ├── config/           # Database configuration
│   │   ├── database/         # Migration and seeding entry points
│   │   ├── middlewares/
│   │   ├── routes/           # API route composition
│   │   ├── shared/           # Shared utilities, errors, responses
│   │   └── utils/
│   ├── tests/unit/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

Most feature modules follow the same flow:

```text
routes → controllers → services → repositories → models
```

Validation schemas and database migrations live alongside their feature. Notifications also contains its queue and worker code.

## Run locally with Docker Compose

Prerequisites: Docker Desktop with Docker Compose.

1. Create a root-level `.env` file. Do not commit it. Set the variables listed below and use local-only credentials.
2. Start the services from the project root:

   ```powershell
   docker compose up --build -d
   ```

3. Apply database migrations and seed roles/permissions:

   ```powershell
   docker compose exec backend npm run db:migrate
   docker compose exec backend npm run db:seed
   ```

4. Create an admin account:

   ```powershell
   docker compose exec backend npm run db:admin
   ```

5. Check the API:

   ```text
   GET http://localhost:5000/api/v1/health
   ```

The local API is available at `http://localhost:5000`. PgAdmin is available at `http://localhost:5050`. The Compose file runs the API in development mode with Nodemon; it is intended for local development, not production deployment.

### Environment variables

Set these in the root `.env` file. Keep real passwords, SMTP credentials, and JWT secrets private.

| Variable | Purpose |
| --- | --- |
| `API_PORT` | Local API port; use `5000` with the supplied Compose port mapping |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL container setup |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | API/worker database connection; use matching database credentials and `DB_HOST=postgres` in Compose |
| `REDIS_HOST`, `REDIS_PORT` | Queue connection; use `redis` and `6379` in Compose |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT signing and expiry configuration |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial admin account for `npm run db:admin` |
| `DUMMY_PAYMENT_PASSWORD` | Password accepted by the simulated payment service |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | SMTP settings required by the notification worker |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | Local PgAdmin login |
| `API_PUBLIC_URL` | Optional public base URL used when constructing product image URLs |
| `SALT_ROUNDS` | Optional password-hashing cost; defaults to `12` |

## API overview

All API routes use the `/api/v1` prefix.

| Route group | Purpose |
| --- | --- |
| `GET /health` | API health check |
| `/auth` | Customer and admin login |
| `/users` and `/user` | Customer registration and authenticated user operations |
| `/products` and `/categories` | Product and category catalog operations |
| `/cart` | Customer cart operations |
| `/checkout` | Customer checkout for cart or direct purchase |
| `/orders` | Customer order history and order details |
| `/admin` | Admin dashboard, customers, orders, products, categories, inventory, and notification listing |

Customer-only and admin-only routes require a JWT and the corresponding role. For detailed request schemas, use the route validation files under `backend/src/modules`.

### Inventory history

The admin inventory history endpoint uses cursor pagination:

```http
GET /api/v1/admin/inventory/:productId/history?limit=20
GET /api/v1/admin/inventory/:productId/history?limit=20&cursor=<nextCursor>
```

The response contains stock movements (`RESTOCK` or `ORDER`) and pagination metadata: `limit`, `hasNextPage`, and `nextCursor`. History is recorded from the time the movement-log migration is applied; earlier quantity changes cannot be reconstructed.

## Database and background jobs

- Migrations are stored in each module's `migrations/` directory and run with `npm run db:migrate`.
- `npm run db:seed` creates the base roles and permissions.
- `npm run db:admin` creates the configured initial admin account.
- BullMQ automatically retries email jobs according to the queue's retry policy. Jobs that exhaust their attempts are persisted for admin review; there is no manual retry endpoint.

Useful commands:

```powershell
docker compose logs -f backend notification-worker
docker compose exec backend npm test
```

## Tests

The project uses Node's built-in test runner and has focused unit tests for inventory restocking, order stock deductions, insufficient stock handling, cursor-paginated inventory history, and order-confirmation email content.

Run them from the project root:

```powershell
docker compose exec backend npm test
```

The current suite is a starting point, not comprehensive end-to-end coverage. Checkout/payment integration, authentication/authorization, and API-level tests are good areas to expand.

## Security and submission notes

- Never include `.env` or real credentials in a public repository or interview submission.
- Use local/test credentials only; rotate any credentials that have been exposed.
- The supplied Compose setup is for development. A production deployment needs production configuration, secret management, and a real payment-provider integration.
