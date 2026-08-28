# Wallet/Deposit MVP Demo

## What This Is

This folder is the Admin Web app for the wallet/deposit MVP. It is a Next.js App Router console used by an administrator to sign in, register and verify customers, review customer wallet balances, deposit funds, request/confirm withdrawal OTPs, and inspect dashboard activity.

The full demo uses three local projects:

- Backend API: `c:\Users\tsion\Desktop\wallet-backend`
- Admin Web: `c:\Users\tsion\Desktop\wallet-admin`
- Flutter customer app: `c:\Users\tsion\Desktop\Flutter-App`

## Environment Variables

### Backend API

Create `c:\Users\tsion\Desktop\wallet-backend\.env` from its `.env.example`.

Required for a local demo:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=replace-me-with-a-long-random-secret
PORT=4000
NODE_ENV=development
SMS_PROVIDER=mock
PUSH_PROVIDER=mock
```

Optional backend demo variables:

```env
AUTH_RATE_LIMIT_MAX=20
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
OTP_RATE_LIMIT_MAX=30
OTP_RATE_LIMIT_WINDOW_MINUTES=10
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
FIREBASE_SERVICE_ACCOUNT_PATH=C:\path\to\firebase-service-account.json
```

Use `PORT=4000` for the smoothest local demo because Admin Web and Flutter default to the backend at `:4000`.

### Admin Web

Create `c:\Users\tsion\Desktop\wallet-admin\.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

`NEXT_PUBLIC_API_URL` is read as `process.env.NEXT_PUBLIC_API_URL` in `lib/api.ts`. Because it is a `NEXT_PUBLIC_*` variable, Next.js inlines it into the browser bundle at build time. Set the same variable in Vercel Project Settings for demo deployments; do not put secrets in it.

### Flutter Customer App

The Flutter app reads its API base URL from a Dart define:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Use `http://10.0.2.2:4000` for the Android emulator to reach a backend running on the host machine. For a physical Android device, use your computer's LAN IP, for example:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:4000
```

Firebase push is optional for the local demo. If enabled, place Firebase Android config at:

```text
c:\Users\tsion\Desktop\Flutter-App\android\app\google-services.json
```

## Local End-To-End Demo Order

1. Start the backend database.

Use Neon, local PostgreSQL, or another PostgreSQL database. Put its connection string in `wallet-backend\.env`.

2. Install, migrate, and seed the backend.

```bash
cd c:\Users\tsion\Desktop\wallet-backend
npm install
npm run migrate
npm run seed
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

Seeded admin:

```text
email: admin@test.com
password: Admin123!
```

3. Start the Admin Web app.

```bash
cd c:\Users\tsion\Desktop\wallet-admin
npm install
npm run dev
```

Open:

```text
http://localhost:3000/login
```

Sign in with `admin@test.com / Admin123!`.

4. Register a test customer and set their PIN.

In Admin Web, open Customers, click Register customer, enter a name, phone number, national ID, and an optional 4-6 digit Customer PIN. Use `123456` for a simple demo PIN.

The backend prints a mock SMS in its terminal:

```text
[MOCK SMS] Message: Your registration OTP is 123456. It expires in 5 minutes.
```

Enter that OTP in Admin Web to activate the customer.

After verification, Admin Web shows a confirmation panel with the customer name, phone number, and a reminder to share the PIN securely. The app never displays the PIN itself.

5. Reset the customer PIN if needed.

Open the active customer's detail page and click Reset PIN. This calls `POST /customers/:id/set-pin` with the new 4-6 digit PIN.

6. Deposit funds.

In Admin Web, open the customer detail page, click Deposit, enter an amount such as:

```text
1,000.00 ETB
```

Submit. The wallet balance, customer transaction statement, and Dashboard Recent Activity should refresh without a page reload.

7. Open the Flutter customer app.

```bash
cd c:\Users\tsion\Desktop\Flutter-App
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Log in with:

```text
phone_number: <TEST_CUSTOMER_PHONE>
pin: 123456
```

The home screen should show the deposited balance, and the transaction list should show the deposit.

## Demo Deployment Notes

Admin Web includes `vercel.json` with the standard install, build, and dev commands for Vercel. For Vercel deployment, set this environment variable in the Vercel project:

```env
NEXT_PUBLIC_API_URL=https://your-backend-demo-url.example.com
```

Build-time API URL check:

```bash
$env:NEXT_PUBLIC_API_URL="https://your-backend-demo-url.example.com"
npm run build
```

The Dashboard top bar displays the configured API host, which is a quick runtime sanity check that the deployed bundle points at the intended backend.

## Admin Web Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm start
```
