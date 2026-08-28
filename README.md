# Wallet Admin

Admin web console for the wallet/deposit MVP. Built with Next.js App Router, TypeScript, and Tailwind CSS v4.

The app supports admin login, dashboard metrics, customer search and registration, registration OTP verification, optional customer PIN setup, customer PIN reset, deposits, OTP-confirmed withdrawals, and per-customer transaction statements.

## Requirements

- Node.js 20.9+
- npm 10+
- Wallet backend running on `http://localhost:4000` by default

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The Admin Web dev server runs at `http://localhost:3000` and redirects to `/login`.

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000` | Base URL of the wallet backend. No trailing slash. |

`NEXT_PUBLIC_API_URL` is read in `lib/api.ts` and is inlined into the client bundle at build time. Set it in Vercel Project Settings for deployed demos. It must be reachable from the browser and must not contain secrets.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Admin Web dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript check |

## Main Flows

### Login

`POST /admin/login` authenticates the seeded admin with email and password. Local demo credentials from the backend seed are:

```text
email: admin@test.com
password: Admin123!
```

### Customers

`/customers` lists customers from `GET /customers` with search, status filter, pagination, loading skeletons, empty states, and retryable error banners.

### Register Customer

The Register customer dialog sends:

```json
{
  "full_name": "...",
  "phone_number": "...",
  "national_id": "...",
  "pin": "123456"
}
```

`pin` is optional and must be 4-6 digits when provided. The form explains that the customer needs this PIN to log into the mobile app. The PIN is cleared before the network request is sent and is never displayed in confirmation UI.

After registration, the admin enters the SMS OTP from the backend mock SMS logs. Once verified, the confirmation panel shows customer name, phone number, and a secure-sharing reminder if a PIN was set.

### Customer Detail

`/customers/[id]` shows profile details, real wallet balance from `GET /customers/:id`, and a paginated bank-statement transaction tab from `GET /customers/:id/transactions`.

Active customers have actions for:

- Deposit: `POST /customers/:id/deposit`
- Withdraw: `POST /customers/:id/withdraw/request-otp`, then `POST /customers/:id/withdraw/confirm`
- Reset PIN: `POST /customers/:id/set-pin`

Money values render as `X,XXX.XX ETB`.

### Dashboard

`/dashboard` uses `GET /admin/dashboard` for Total Customers, Active Customers, Total Deposits, Total Withdrawals, Total Balance, and the Recent Activity table.

### Transactions

The current backend contract exposes customer transaction statements and dashboard recent activity, not a global ledger endpoint. The `/transactions` page points admins to the live customer-statement flow.

## Deployment

This project includes `vercel.json` with the standard demo deployment commands:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci"
}
```

Set this environment variable in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-backend-demo-url.example.com
```

To verify build-time API URL wiring locally:

```powershell
$env:NEXT_PUBLIC_API_URL="https://your-backend-demo-url.example.com"
npm run build
```

The top bar displays the configured API host for a quick demo sanity check.

