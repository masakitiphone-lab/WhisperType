import { createClient } from "@supabase/supabase-js";
import { authStorageKey, browserAuthStorage } from "@/lib/authStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: false,
    autoRefreshToken: true,
    persistSession: true,
    storageKey: authStorageKey,
    storage: browserAuthStorage,
  },
});
