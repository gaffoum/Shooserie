/**
 * Whitelist des UIDs admin pour les routes /admin/*.
 *
 * Pour ajouter un admin :
 *   - Ajouter son UID dans ADMIN_USER_IDS ci-dessous
 *   - Mettre a jour les fonctions SQL get_user_health_admin,
 *     get_all_sticker_orders_admin, mark_order_shipped_admin,
 *     mark_order_preparing_admin (whitelist hardcodee dans chaque)
 */
export const ADMIN_USER_IDS: ReadonlyArray<string> = [
  'f5f4725b-497b-4dcb-8232-f3167ed1e896', // Layon (Gill)
]

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}