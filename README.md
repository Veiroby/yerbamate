This is a [Next.js](https://nextjs.org) app for YerbaTea.

## Getting Started

### Prerequisites

- Node.js + npm
- PostgreSQL

### Configure environment

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

At minimum, set:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY` (use `sk_test_...` in development)
- `STRIPE_WEBHOOK_SECRET` (use Stripe CLI or Dashboard)
- `NEXT_PUBLIC_APP_ORIGIN`
- `NEXTAUTH_URL` (for example `https://www.yerbatea.lv` in production)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM` (for example `YerbaTea <orders@yerbatea.lv>`; must be verified in Resend)

### Run migrations

```bash
npx prisma migrate deploy
```

### Start the dev server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe payments

This project uses **Stripe Checkout** via:

- `POST /api/stripe/checkout` (creates a Checkout Session, redirects)
- `POST /api/stripe/webhook` (verifies Stripe signatures and marks orders as paid)

### Local webhook forwarding

Use the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `.env` as `STRIPE_WEBHOOK_SECRET`.

### Security notes

- Never expose `STRIPE_SECRET_KEY` to the browser.
- Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`.
- Use HTTPS in production.

## Google sign-in

Google OAuth is already wired in the app via:

- `GET /api/auth/google`
- `GET /api/auth/callback/google`

Create credentials in Google Cloud Console:

1. Go to **APIs & Services -> OAuth consent screen** and configure your app.
2. Go to **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.
3. Choose **Web application**.
4. Add:
   - Authorized JavaScript origin: `https://www.yerbatea.lv`
   - Authorized redirect URI: `https://www.yerbatea.lv/api/auth/callback/google`
5. Copy the generated values into:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Set `NEXTAUTH_URL=https://www.yerbatea.lv` on the production server.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
