import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://dclzlgglpthvpkqxdwzj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjbHpsZ2dscHRodnBrcXhkd3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDc4NjYsImV4cCI6MjA3ODI4Mzg2Nn0.CPpu2anHoajgiuKsoXOZCGkuycsiRe3UxU3V38NUzWY",{
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}
);
