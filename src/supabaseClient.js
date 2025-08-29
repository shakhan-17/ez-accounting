import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://citeaourwapzndrrzplw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdGVhb3Vyd2Fwem5kcnJ6cGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTk4MjYsImV4cCI6MjA3MDk3NTgyNn0.EOpVnWQ62c2pBxdnLilymxsNN4oXIzLl4LwsdLLy_fs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);