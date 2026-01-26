
import { createClient } from '@supabase/supabase-js';

// Access env variables safely handling TypeScript errors if types are missing
const env = (import.meta as any).env || {};

// Prioritize environment variables, fallback to hardcoded keys provided by user
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://xukbtfipvdxtobtsidum.supabase.co';
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a2J0ZmlwdmR4dG9idHNpZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTcyOTQsImV4cCI6MjA4MzE5MzI5NH0.uhYVcAh9Ea17IUeW5-K4CigXDjcfzqwuz3SRJp_QmeU';

console.log('✅ Supabase Client Initialized');

if (!env.VITE_SUPABASE_URL) {
    console.log('ℹ️ Usando chaves de conexão direta (Hardcoded).');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
