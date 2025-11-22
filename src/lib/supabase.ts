import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fjeffdiayxvbiteewgvz.supabase.co'
// This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies.
// You can find more information about this at https://supabase.com/docs/guides/auth/row-level-security
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZWZmZGlheXh2Yml0ZWV3Z3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTkyOTcsImV4cCI6MjA3NzU5NTI5N30.xOC4_UjVZq2Zs2hnLeAbb694sF9GAMlGmrrgFVTdwKc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- New Supabase Client for Production Database ---
let supabaseProdInstance: SupabaseClient | null = null;

export const getSupabaseProd = (): SupabaseClient => {
  if (supabaseProdInstance) {
    return supabaseProdInstance;
  }

  const supabaseUrlProd = process.env.NEXT_PUBLIC_SUPABASE_URL_PROD;
  const supabaseAnonKeyProd = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD;

  if (!supabaseUrlProd || !supabaseAnonKeyProd) {
    console.error("Production Supabase URL or Anon Key is not defined. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL_PROD and NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD");
    // Return a dummy client to avoid crashing the app, but it will fail on queries.
    return createClient('https://dummy.co', 'dummykey');
  }

  supabaseProdInstance = createClient(supabaseUrlProd, supabaseAnonKeyProd);
  return supabaseProdInstance;
};
