# Credit Mint

Credit Mint is a full-stack app for managing borrowers, loans, interest, reminders, and collections.

## Project Structure

```text
CreditMint/
|-- client/   React + Vite + Tailwind frontend
`-- server/   Express + Prisma + MySQL backend
```

## Prerequisites

- Node.js 18+
- MySQL 8+
- npm 9+

## Quick Start

### 1. Create the database

```sql
CREATE DATABASE creditmint;
```

### 2. Configure backend environment

Copy the backend env file:

```bash
cd server
copy .env.example .env
```

Edit `server/.env` and set your real values.

Minimum required:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/creditmint"
JWT_SECRET=your_super_secret_here
```

### 3. Install and set up the backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### 4. Install and run the frontend

```bash
cd ../client
npm install
npm run dev
```

### 5. Start the backend

```bash
cd ../server
npm run dev
```

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Prisma Studio: `npx prisma studio`

## Demo Login

```text
Email:    demo@creditmint.app
Password: password123
```

## Gmail SMTP Setup

Place SMTP settings in `server/.env`.

Example:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Credit Mint <your@gmail.com>"
```

Notes:

- Use a Gmail App Password, not your normal Gmail password.
- Keep the backend running so reminder cron jobs can send mail.
- If SMTP is not configured or Gmail rejects the credentials, the app still runs normally.

## SMTP Verification on Startup

When the backend starts, Credit Mint verifies the SMTP transporter once.

Possible log results:

- `[Email] SMTP connection verified successfully`
- `[Email] SMTP verification skipped: SMTP not configured`
- `[Email] SMTP verification failed: ...`

The app does not crash if SMTP verification fails.

## Reminder Email Flow

The cron scheduler runs every day at `9:00 AM IST`.

It:

1. Finds loans due tomorrow
2. Finds loans due today
3. Finds overdue loans
4. Creates in-app notifications
5. Sends reminder emails when the borrower has an email address
6. Saves success or failure in `ReminderLog`

Email templates included:

- Due Tomorrow
- Due Today
- Overdue
- Payment Received

## SMTP Test API

Authenticated route:

```http
POST /api/test-email
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body:

```json
{
  "to": "recipient@example.com"
}
```

This sends a test email immediately using either the saved per-user SMTP settings or the backend `.env` SMTP values.

## Gmail Troubleshooting

If Gmail SMTP is not sending:

1. Make sure 2-Step Verification is enabled on the Gmail account.
2. Use a Gmail App Password in `SMTP_PASS`.
3. Make sure `SMTP_USER` matches the Gmail account that created the App Password.
4. Make sure `SMTP_FROM` uses the same Gmail address or a valid sender identity for that mailbox.
5. Keep `SMTP_PORT=587` for TLS unless you intentionally switch to port `465`.
6. Check backend logs for the SMTP verification error.
7. Use `POST /api/test-email` before waiting for cron.

## API Notes

Useful endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/loans`
- `POST /api/loans/:id/pay`
- `POST /api/loans/:id/collect-interest`
- `POST /api/test-email`
- `GET /api/notifications`
- `GET /api/reports/summary`

## Scripts

### Server

```bash
npm run dev
npm run start
npm run db:push
npm run db:generate
npm run db:studio
npm run seed
```

### Client

```bash
npm run dev
npm run build
npm run preview
```
# CreditMint
