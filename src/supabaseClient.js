import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqgqdqzukyyqkmfcrigk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ3FkcXp1a3l5cWttZmNyaWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNzUxNDYsImV4cCI6MjEwOTY1MTE0Nn0.SPeiH95TR1np5fAr9kSM77OpEnVYE4luXfsFMloLwrg';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
