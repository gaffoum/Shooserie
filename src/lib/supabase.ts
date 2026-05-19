import { createClient } from '@supabase/supabase-js'

/**
 * Clés publishable Supabase = clés publiques destinées au client.
 * La sécurité réelle est assurée par les policies RLS côté serveur.
 * On hardcode en fallback pour que le build Vercel fonctionne sans config env.
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://eykhnpnmpcrvcpajirst.supabase.co'

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_dol4fM30Onbzo0sbZS_zjA_PfqRgxBX'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
