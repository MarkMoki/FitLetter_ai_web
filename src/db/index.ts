import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

// Load from env/env.example if not provided via .env/.env.local
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  loadEnv({ path: 'env' });
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  loadEnv({ path: 'env.example' });
}

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!PUBLIC_URL || (!PUBLIC_ANON_KEY && !SERVICE_ROLE_KEY)) {
  throw new Error(
    'Supabase env vars missing. Provide NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Server actions and API routes should use the service role key if available to bypass RLS.
// We export a single client named `db` for server usage.
export const db: SupabaseClient = createClient(
  PUBLIC_URL,
  (SERVICE_ROLE_KEY || PUBLIC_ANON_KEY)!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
