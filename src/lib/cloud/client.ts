import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cloudProject } from './project';
const url = import.meta.env.PUBLIC_SUPABASE_URL || cloudProject.url;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || cloudProject.publishableKey;
export const cloudConfigured = Boolean(url && key);
let client: SupabaseClient | null = null;
export function getCloudClient() {
  if (!cloudConfigured) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  return client;
}
