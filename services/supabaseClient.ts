
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    const meta = import.meta as any;
    return meta.env?.[key] || "";
};

const URL = "https://xukbtfipvdxtobtsidum.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a2J0ZmlwdmR4dG9idHNpZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTcyOTQsImV4cCI6MjA4MzE5MzI5NH0.uhYVcAh9Ea17IUeW5-K4CigXDjcfzqwuz3SRJp_QmeU";

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || URL;
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.includes('supabase.co'));

// Inicialização segura
let client;
try {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
    });
} catch (e) {
    console.error("Critical Supabase Init Error:", e);
}

export const supabase = client!;
