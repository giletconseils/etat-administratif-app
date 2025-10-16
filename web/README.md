This is a [Next.js](https://nextjs.org) project with a CSV upload to check SIRET radiations via INSEE.

## Getting Started

Setup:

1) Optionally configure INSEE Sirene API credentials in `.env.local`:

```
SIRENE_KEY=your_client_id
SIRENE_SECRET=your_client_secret
```

If not provided, a deterministic mock is used (odd last digit => radiée).

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

Open [http://localhost:3000](http://localhost:3000) with your browser.

Upload a CSV containing a `SIRET` column (case-insensitive). Click "Vérifier" to fetch statuses; by default only radiées are shown. Use the Export button to download Excel.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
