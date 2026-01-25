import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gcclvmmgfocwmdugetgl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2x2bW1nZm9jd21kdWdldGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzkxMTAsImV4cCI6MjA4MzQ1NTExMH0.KYnOXwryMN596_mNfspx5XYRaQzZ728NPKm4CgtobpY';

console.log('✅ Supabase Client Initialized with provided keys');

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);