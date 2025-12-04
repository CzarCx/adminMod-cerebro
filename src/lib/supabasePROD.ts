import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://msnktspkrqloiyzzdlad.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbmt0c3BrcnFsb2l5enpkbGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTM3MTAsImV4cCI6MjA3MTcyOTcxMH0.C1Vfl5A6DCrPLEyWvT1gEatWXWSdw2GjqQ2KiFBszPA'

export const supabasePROD = createClient(supabaseUrl, supabaseAnonKey)
