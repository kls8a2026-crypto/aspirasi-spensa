import app from '../../../server.ts';

// Explicit Vercel Function for the Google OAuth endpoint.
// This keeps the existing Express route and Supabase OAuth logic unchanged.
export default app;
