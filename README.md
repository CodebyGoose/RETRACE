# RETRACE v2.3

A lost and found system for the University of the Assumption, built from the Figma file
"RETRACE v2.3" with React, Vite and Tailwind CSS v4.

## Run it

```bash
npm install
npm run assets   # downloads the photos and seal from Figma into public/images
npm run dev
```

`npm run assets` uses temporary Figma links (valid for 7 days from 2026-10-23). If they have
expired, export the images from Figma into `public/images` using the file names listed in
`scripts/assets-manifest.json`. Until the images exist, the app shows soft grey placeholders in their place.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the project URL and the publishable
   (formerly `anon`) key.
3. Copy `.env.example` to `.env.local` and fill in those two values:

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Restart `npm run dev` after changing environment variables.

The shared client is exported from `src/lib/supabase.js`. Only the publishable key belongs
in this browser app. Never put a `service_role` or secret key in `.env.local`, source code, or
Vercel's client-side environment variables. Database access must be protected with Supabase
Row Level Security (RLS) policies.

Run `supabase/items.sql` in the Supabase SQL Editor to create the `items` table, its RLS
policies, and three demo records. For Vercel, add both `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` under **Settings → Environment Variables** for the
Production environment, then redeploy. If those variables are not present, the deployed
app stays usable in demo mode with local sample items, while sign-in and publishing reports
remain disabled until Supabase is connected.

## Deploy to Vercel

1. Push this folder to a GitHub repo, **including `public/images`** once the assets are downloaded.
2. On vercel.com choose **Add New → Project** and import the repo.
3. Vercel detects Vite automatically (`vercel.json` sets the build command, `dist` output and a
   rewrite so deep links like `/items/LF-2048` work). Add the two `VITE_` environment variables
   before deploying. Click **Deploy**.

Or from the terminal: `npm i -g vercel && vercel --prod`.

## Screens

| Route | Figma frame |
| --- | --- |
| `/` | Login |
| `/home` | Home |
| `/browse` | Browse items (search, filters, tabs, sort) |
| `/items/:id` | Item details |
| `/report` | Report an item (photo upload, draft saved to localStorage) |
| `/account` | Profile and settings |

## Notes

- Supabase-backed item queries and authentication are wired into the main pages. If the
  environment variables are unavailable, item reads use the sample data in `src/data/items.js`
  so a deployment does not render a blank page. Login and publishing a report require the live
  Supabase configuration. Claims and saving settings are still planned features.
- Theme colours and fonts (Inter, Rubik Glitch for the wordmark) are tokens in `src/index.css`.
- Icons come from `lucide-react`, matching the icon names used in the design.
