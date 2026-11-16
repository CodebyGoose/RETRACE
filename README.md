# RETRACE

## Lost and found for the University of the Assumption

RETRACE is a campus lost-and-found management system for students and administrators. Students
can report lost or found items, follow custody updates, submit ownership claims, and track claim
decisions. Administrators can verify student accounts, confirm office turnover, review private
claim evidence, and record the physical release of an item.

The interface follows the RETRACE v2.3 Figma design: calm campus-focused surfaces, clear status
language, generous spacing, and an editorial layout that keeps actions and evidence easy to scan.

## Product workflow

### Students

- Sign in with a university account.
- Report a lost or found item with a photo and campus details.
- Have the report automatically associated with the authenticated account.
- See found items without exposing the finder’s identity.
- Submit an ownership claim only after a found item is confirmed in office custody.
- Provide private identifying details and optional supporting evidence.
- Track reports and claim decisions from the account and claims pages.
- Receive password setup and password recovery emails.

### Administrators

- View dashboard metrics, report activity, users, and report trends.
- See the identity of students who submitted reports or claims.
- Create student accounts with temporary passwords.
- Confirm that found items have been received by the designated office.
- Approve or reject ownership claims after reviewing evidence.
- Verify a student’s school ID before releasing an item.
- Record the final item release and prevent duplicate or conflicting releases.

### Status model

Found items move through these custody states:

1. `Pending Turnover`
2. `In Custody`
3. `Claimed`

Claims use a separate review state:

1. `Pending Review`
2. `Approved`
3. `Rejected`

Lost reports retain the existing lost-item workflow.

## Design system

- **Typography:** Inter for interface text and Rubik Glitch for the RETRACE wordmark.
- **Palette:** deep brand blue, forest green, warm lost-item tones, pale sage surfaces, and
  neutral borders.
- **Layout:** responsive single-column and split-column layouts built from reusable cards,
  fields, buttons, status pills, and page headers.
- **Interaction:** keyboard-visible focus states, semantic labels, responsive controls, inline
  validation, and explicit success/error messaging.
- **Visual language:** restrained campus utility UI rather than decorative dashboards; charts use
  lightweight CSS bars and progress indicators.

Design tokens and global styles are defined in [`src/index.css`](./src/index.css). Shared UI
building blocks are in [`src/components/ui.jsx`](./src/components/ui.jsx).

## Technology stack

### Frontend

- React 19
- React Router 7
- Vite 6
- Tailwind CSS 4
- `lucide-react` for interface icons
- Supabase JavaScript client

### Backend and services

- Supabase Authentication
- Supabase Postgres
- Postgres Row Level Security
- Supabase Storage for item photos and private claim evidence
- Supabase Edge Functions for privileged account creation and admin data access
- Vercel for production hosting

The Supabase CLI is installed as a project development dependency and should be run with
`npx supabase`.

## Project structure

```text
src/
  components/       Shared layout and UI primitives
  data/             Supabase data access modules
  lib/              Supabase client and authentication helpers
  pages/            Login, reports, browsing, account, claims, and admin screens
supabase/
  items.sql         Tables, views, RLS policies, storage policies, and admin RPCs
  functions/
    create-student/ Creates accounts and sends password setup emails
    list-users/     Lists users for the admin directory
    list-admin-data/Loads admin-only reports, users, claims, and evidence links
public/
  images/           Campus, seal, and item imagery
scripts/
  fetch-assets.mjs  Downloads design assets from the asset manifest
```

## Run locally

Requirements:

- Node.js 20 or newer
- npm
- A Supabase project for authentication and database features

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

The local application is normally available at `http://localhost:5173`.

### Environment variables

Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only the publishable key belongs in browser environment variables. Never put a Supabase
`service_role` key or secret key in `.env.local`, source code, Vercel `VITE_` variables, or
client-side bundles.

Restart Vite after changing environment variables.

## Supabase setup

### 1. Apply the database schema

Run [`supabase/items.sql`](./supabase/items.sql) in the Supabase SQL Editor. It creates and
configures:

- Item custody fields and transitions
- `claims` and `item_events` tables
- Public item details with finder privacy
- Student and admin RLS policies
- Private claim-evidence storage
- Admin-only turnover, review, and release functions
- Service-role access for privileged Edge Functions

The script is designed to be rerun while developing.

### 2. Create an administrator

Create a user under **Authentication → Users**, then assign the admin role in the SQL Editor.
Replace the email before running:

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

Sign out and back in after changing the role so the refreshed JWT contains the updated
`app_metadata`.

### 3. Deploy Edge Functions

Authenticate and link the local CLI once:

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

Deploy the functions:

```bash
npx supabase functions deploy create-student
npx supabase functions deploy list-users
npx supabase functions deploy list-admin-data
```

The functions use Supabase server-side credentials automatically. Those credentials must never
be exposed to the browser.

### 4. Configure authentication emails

Under **Authentication → URL Configuration**, add both redirect URLs:

```text
http://localhost:5173/change-password
https://your-vercel-domain.vercel.app/change-password
```

Add a custom-domain version as well if the production site uses one. Configure SMTP under
**Authentication → SMTP Settings** before production use. The Reset Password email template is
used for both:

- One-time password setup after an administrator creates a student account
- The **Forgot password?** flow

## Deploy to Vercel

1. Import the repository into Vercel.
2. Add these Production environment variables:

   ```text
   VITE_SUPABASE_URL
   VITE_SUPABASE_PUBLISHABLE_KEY
   ```

3. Deploy the project.
4. Add the final Vercel URL to Supabase Authentication redirect URLs.

Vite builds the production bundle with:

```bash
npm run build
```

The repository also contains a Vercel rewrite configuration so direct links such as
`/items/LF-2048`, `/claims`, and `/admin` resolve correctly.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Student and administrator sign in |
| `/home` | Student home and recent reports |
| `/browse` | Search and filter public item listings |
| `/items/:id` | Item details and ownership claim form |
| `/report` | Lost or found item report form |
| `/account` | Profile, reports, saved items, and settings |
| `/claims` | Student claim tracking |
| `/change-password` | Temporary-password and recovery-password updates |
| `/admin` | Admin overview, user directory, custody, claims, and release management |

## Security notes

- Browser code uses only the Supabase publishable key.
- Finder identities are excluded from public item views.
- Student claims are restricted to the authenticated claimant.
- Claim evidence is stored in a private bucket.
- Admin actions are protected by `app_metadata.role = 'admin'`.
- Claims cannot be approved by their own administrator.
- A partial unique index prevents multiple active claims by one student for one item.
- A unique approved-claim index prevents conflicting approvals.
- Item release verifies the claimant’s school ID and locks the item into `Claimed`.
- Item turnover, claim decisions, and releases are recorded in `item_events`.

## Useful commands

```bash
npm run dev       # Start the local development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run assets    # Download design assets into public/images
```
