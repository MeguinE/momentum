import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigured = Boolean(url && key);
let client: SupabaseClient | null = null;
export function getCloudClient() {
  if (!cloudConfigured) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  return client;
}
