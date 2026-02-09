// lib/supabaseClient.ts
// Client-side Supabase client for browser usage
// Note: For browser usage with @supabase/ssr, we use createBrowserClient
// which automatically handles cookies via the browser's cookie storage
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ghsgnjzkgygiqmhjvtpi.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc2duanprZ3lnaXFtaGp2dHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjE2OTksImV4cCI6MjA2NTY5NzY5OX0.IFqbyxmYzCDZZEZpV0MIpPQWVxBplygWlnap1q97hcg';

// createBrowserClient automatically handles cookies in the browser
// It uses the browser's native cookie storage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
