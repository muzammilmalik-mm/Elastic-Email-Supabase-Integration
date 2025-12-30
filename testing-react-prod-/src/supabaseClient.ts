import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qfyomvwcugkqlbskhzhu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeW9tdndjdWdrcWxic2toemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MTAwMzcsImV4cCI6MjA1MDE4NjAzN30.YBtKvwEWJQYHBAkLmR6X-eTwNf3aTOJEXPNLr8WwVAA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
