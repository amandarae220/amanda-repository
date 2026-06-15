// Reference for local environment.ts values.
// supabaseAnonKey is public by design (Supabase RLS is the security boundary).
// adminPasswordHash is a SHA-256 hex digest of the password — never store plaintext.
// Generate a new hash with: printf "%s" "your-password" | shasum -a 256
export const environment = {
  production: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
  adminPasswordHash: 'SHA256_HEX_OF_YOUR_ADMIN_PASSWORD',
};
