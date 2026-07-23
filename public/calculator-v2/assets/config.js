// Supabase project config — Calculator2.0 uses its own project (separate
// from amanda-repository) so analytics data stays isolated.
// The anon key is public by design: Supabase Auth + Row Level Security are
// the security boundary, not the key. See docs/calculator_events_schema.sql
// for the RLS policies that protect this table.
window.CALC_CONFIG = {
    SUPABASE_URL:      'https://bkkcwlpkgwqobfdtcomx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra2N3bHBrZ3dxb2JmZHRjb214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjY3OTMsImV4cCI6MjA5NzMwMjc5M30.rqkAIgI20L11UHsx2BH5m6CHZyxY1h52SqBj9rElLlw',
    EVENT_TABLE:       'calculator_events',
};
