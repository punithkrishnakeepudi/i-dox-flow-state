# i-dox-flow-state

A modern, collaborative document editor built with React, TypeScript, Supabase, and Tailwind CSS.

## Features
- Real-time collaborative editing
- Optional authentication (anonymous and logged-in users supported)
- Document sharing and collaboration
- Password-protected documents
- Export documents as PDF
- Sidebar for easy document navigation
- Responsive, accessible, and production-ready UI

## Tech Stack
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Realtime)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Supabase account and project

### Setup
1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
4. **Run the development server:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

## Database Migrations
- Migrations are located in the `supabase/migrations/` directory.
- To apply migrations, use the Supabase CLI:
  ```sh
  npx supabase db push
  ```
- Ensure your local project is linked to your Supabase project (`npx supabase link`).

## Deployment
1. **Build the project:**
   ```sh
   npm run build
   ```
2. **Deploy the `dist/` folder** to your preferred host (Vercel, Netlify, custom server, etc.).
3. **Set environment variables** on your host (see above).
4. **Apply all database migrations** to your Supabase project.

## Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Contribution
Contributions are welcome! Please open an issue or submit a pull request for improvements or bug fixes.

## License
[MIT](LICENSE)
