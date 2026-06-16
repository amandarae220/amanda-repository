// Reference for local environment.ts values.
// supabaseAnonKey is public by design (Supabase Auth + RLS are the security boundary).
// Admin login uses Supabase Auth — credentials live in Supabase, not in source.
export const environment = {
  production: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
};
