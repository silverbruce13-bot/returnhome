import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL') {
    console.warn('Supabase credentials are missing or not configured in .env file.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
