# 📦 SHOOSERIE — Handoff Session (mardi 26 mai 2026)

## 🎯 Contexte

Shooserie = app web de gestion de collection de sneakers, en cours de dev itératif.
- **URL prod** : https://shooserie.tech
- **URL dev preview** : https://shooserie-git-dev-gill-affoums-projects.vercel.app
- **Repo GitHub** : https://github.com/gaffoum/Shooserie.git
- **Stack** : Vite 5 + React 18 + TypeScript (strict) + Supabase (Auth + Postgres + RLS + Storage) + React Router 6 + @tanstack/react-query
- **Design** : Palette Jordan/Bred (Bred Red `#CE1141`, noir `#0A0A0A`, fond `#F5F5F5`/white), polices Outfit (titres) + Inter/Poppins (body)
- **Workdir Windows** : `C:\Users\gaffo\OneDrive\Documents\PROJET\Shooserie`

## 🔧 Infrastructure technique

### Supabase
- **Project ID** : `eykhnpnmpcrvcpajirst`
- **Org** : Laydan (free tier)
- **Region** : eu-west-1
- **Auth** : email/password (migration depuis magic-link faite plus tôt dans le projet)
- **Admin email** : `gaffoum@gmail.com`
- **Compte test** : `gaffoum+test1@gmail.com` (display_name = "Titi", configuré)

### Vercel
- **Team** : `team_eIuUfs7yD8UmBMIwYTHEvrol`
- **Project** : `prj_7vyhcjyFGFOTV3LqDzIlQ9sJc2Zu`
- **Branche prod** : `main` → shooserie.tech
- **Branche dev** : `dev` → dev preview

### Git workflow (CRITIQUE)
- Tout le dev se fait sur la branche `dev`
- Toujours vérifier `git branch` (`* dev`) AVANT chaque commit/push
- Bug récurrent : commit sur `main` au lieu de `dev` → résolu avec `git stash` + `git checkout dev` + `git stash pop`
- Merge en prod : `git checkout main && git merge dev && git push origin main`

## 📊 État DB (au matin du 26 mai)

| Métrique | Valeur |
|----------|--------|
| Total users | 107 |
| Total sneakers | 874 (+76 cette nuit 🔥) |
| Paires en vente | 10 |
| Pseudos configurés | 2 (gaffoum=Layon + Titi) |
| Collections publiques | 3 |

## 🗄️ Schema DB (tables principales)

### `profiles`

### `sneakers`
- Champs clés : `id`, `user_id`, `brand`, `name`, `colorway`, `sku`, `size_eu`, `size_us`, `photo_url`, `stockx_image_url`, `is_for_sale`, `target_sale_price`, `created_at`

### `conversations` et `messages`
- `conversations` : user1_id, user2_id, sneaker_id, created_at
- `messages` : conversation_id (ON DELETE CASCADE), sender_id, content, read_at, created_at

## 🔒 RLS Policies actives

### `profiles`
- SELECT : `Profiles are viewable by everyone` (qual: `true`)
- INSERT : `Users can insert own profile` (with_check: `auth.uid() = id`)
- UPDATE : `Users can update own profile` (qual: `auth.uid() = id`)

### `sneakers`
- SELECT : `Anyone can view public collections` (qual: EXISTS profile where p.id=user_id AND p.collection_public=true)
- SELECT : `Anyone can view sneakers for sale` (qual: `is_for_sale = true`)
- SELECT : `Users read their own sneakers` (qual: `auth.uid() = user_id`)
- INSERT/UPDATE/DELETE : own user_id only

### `conversations`
- SELECT : own (user1_id OR user2_id)
- INSERT : own
- DELETE : own (user1_id OR user2_id) ← ajouté ce sprint

### `messages`
- SELECT/INSERT/UPDATE/DELETE : par sender_id check
- Cascade ON DELETE conversation_id ← supprimer une conv supprime ses messages

## 🛠️ RPC functions

### `is_pseudo_available(p_pseudo TEXT) RETURNS BOOLEAN`
- Check case-insensitive si un pseudo est dispo
- Exclut le current user (auth.uid())
- Granted to authenticated
- Utilisé par le modal pseudo

### Index
- `profiles_display_name_lower_idx` sur `LOWER(display_name)` (perf check unicité)

## ✅ Features livrées récemment

### Hier (lundi 25 mai)
- `/marketplace` : toggle grille/liste + bouton ← Dashboard + back link
- `/messages` : header chat (nom vendeur + paire) + bouton ← Dashboard
- Suppression d'un message (icône poubelle, 2 clics confirm)
- Suppression conversation entière (button + redirect)
- Modal `PseudoSetupGuard` bloquant à la connexion :
  - Validation regex `/^[a-zA-Z0-9._-]{3,20}$/`
  - Check unicité temps réel (debounce 500ms) via RPC `is_pseudo_available`
  - Reload page après save (window.location.reload) pour fermer le modal
- Visuels marketing thème Bred générés (stories teasing/rappel/launch/récap + milestone 100 users)

### Ce matin (mardi 26 mai)
- **Action #1** : `WelcomeHeader.tsx` créé dans `src/components/`, affiche `Salut [display_name] !` en haut du Dashboard (nom en bred, fontSize 32, font Outfit)
- **Action #2** : `AppHeader.tsx` modifié — le bouton profil affiche maintenant `profile?.display_name ?? user?.email` (tooltip garde l'email pour les power-users)

## 📁 Architecture fichiers clés

rc/
├── App.tsx                     ← Routes + <PseudoSetupGuard /> au top
├── components/
│   ├── AppHeader.tsx           ← Bouton profil (pseudo, plus email)
│   ├── PseudoSetupGuard.tsx    ← Modal bloquant à la connexion
│   └── WelcomeHeader.tsx       ← "Salut [pseudo] !" sur Dashboard
├── contexts/
│   └── AuthContext.tsx         ← useAuth() exposant { user, session }
├── i18n/
│   ├── I18nContext.tsx         ← useT() retourne objet, destructurer { t }
│   └── dictionaries.ts         ← clés flat avec dots (fr ligne 12-411, en 413-810)
├── lib/
│   ├── queries.ts              ← TOUS les hooks @tanstack/react-query
│   ├── supabaseClient.ts
│   └── stockx.ts               ← rate hardcodé 0.92 EUR/USD
└── pages/
├── Account.tsx             ← InviteSection, EmailSection, CollectionVisibilitySection, PasswordSection, AdminSection (conditional), DangerSection
├── Admin.tsx               ← protected by ADMIN_EMAIL check
├── Dashboard.tsx           ← <WelcomeHeader /> + KPI cards
├── Login.tsx
├── Marketplace.tsx         ← Toggle grille/liste + back link
├── MarketplaceDetail.tsx
├── Messaging.tsx           ← Suppression message + conversation + back link
├── MyListings.tsx          ← /ventes
└── SneakerForm.tsx

## 🔌 Hooks `queries.ts` (déjà existants)

```ts
// User / Auth
useMyProfile()                 // Profile actuel via auth.uid()
useUpdateMyProfile()           // Update collection_public, etc.
useUserCount(email)            // Stats admin
useCheckPseudoAvailability(pseudo, enabled)  // Check via RPC
useSetMyPseudo()               // Set display_name + pseudo_configured=true

// Sneakers
useSneakers()                  // own sneakers, filter user_id explicite
useSneaker(id)
useMarketplaceSneakers()       // is_for_sale=true global

// Messages
useMyConversations()
useConversationMessages(id)
useSendMessage()
useMarkMessagesAsRead()
useDeleteMessage()             // delete by sender_id
useDeleteConversation()        // cascade messages auto

// Constants
ADMIN_EMAIL = 'gaffoum@gmail.com'
```

### Type `Profile` actuel
```ts
export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  collection_public: boolean
  pseudo_configured: boolean
  created_at: string
  updated_at: string
}
```

## 🌍 i18n important

- **Path import** : `'@/i18n/I18nContext'` (avec `@`, PAS `../i18n/...`)
- **Hook** : `useT()` qui retourne un OBJET, donc **destructurer** : `const { t } = useT()`
- **Clés** : flat avec dots (ex: `marketplace.viewGrid`, `messaging.typeMessage`)
- **Pas de clé `messaging.placeholder`** → utiliser `messaging.typeMessage` à la place
- Toujours ajouter les nouvelles clés en FR (avant ligne 411) ET en EN (avant ligne 810)

## 🎯 Backlog à faire AUJOURD'HUI

### Action #3 — Page profil public `/u/:pseudo` (à coder)

**Specs validées :**
- **Header** (B) : pseudo + nb paires + nb en vente + date d'inscription
- **Sneakers** (C + filtre marque) : toutes paires + toggle grille/liste + filtre marque
- **Si collection privée** (A) : page vide avec message "Collection privée"
- **Onglets** (A) : "Tout" / "En vente"

**Plan technique :**

1. **Hook `useUserProfileByPseudo(pseudo)`** à ajouter dans `src/lib/queries.ts` :
```ts
   export type PublicUserProfile = {
     id: string
     display_name: string
     collection_public: boolean
     created_at: string
     pseudo_configured: boolean
     total_sneakers: number
     for_sale_count: number
   }
   
   export function useUserProfileByPseudo(pseudo: string) {
     return useQuery({
       queryKey: ['user-profile-by-pseudo', pseudo.toLowerCase()],
       queryFn: async () => {
         const { data: profile } = await supabase
           .from('profiles')
           .select('id, display_name, collection_public, created_at, pseudo_configured')
           .ilike('display_name', pseudo)
           .maybeSingle()
         if (!profile) return null
         
         const { count: total } = await supabase
           .from('sneakers')
           .select('id', { count: 'exact', head: true })
           .eq('user_id', profile.id)
         
         const { count: forSale } = await supabase
           .from('sneakers')
           .select('id', { count: 'exact', head: true })
           .eq('user_id', profile.id)
           .eq('is_for_sale', true)
         
         return { ...profile, total_sneakers: total ?? 0, for_sale_count: forSale ?? 0 }
       },
       enabled: !!pseudo,
       staleTime: 30_000,
     })
   }
```

2. **Hook `useUserSneakers(userId, onlyForSale)`** :
```ts
   export function useUserSneakers(userId: string | undefined, onlyForSale: boolean) {
     return useQuery({
       queryKey: ['user-sneakers', userId, onlyForSale],
       queryFn: async () => {
         if (!userId) return []
         let q = supabase.from('sneakers').select('*').eq('user_id', userId).order('created_at', { ascending: false })
         if (onlyForSale) q = q.eq('is_for_sale', true)
         const { data } = await q
         return (data ?? []) as Sneaker[]
       },
       enabled: !!userId,
     })
   }
```
   RLS filtre automatiquement : si `collection_public = true` → toutes les paires ; sinon → seulement `is_for_sale = true`.

3. **Page `src/pages/UserProfile.tsx`** :
   - `useParams<{ pseudo: string }>()`
   - States : `tab: 'all' | 'forsale'`, `view: 'grid' | 'list'`, `brand: string`
   - Loading + error states + 404 si user introuvable
   - Header avec backlink → /dashboard
   - Si `!collection_public` → afficher message "Collection privée" centré avec icône 🔒
   - Sinon : tabs + select marque + toggle grille/liste + grille de cards
   - Badge "À VENDRE" rouge bred en absolute sur les paires en vente
   - Prix affiché en bred si is_for_sale
   - Fallback photo : photo_url → stockx_image_url → emoji 👟

4. **Route dans `src/App.tsx`** :
   - Import : `import { UserProfile } from './pages/UserProfile'`
   - Route : `<Route path='/u/:pseudo' element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />` (à insérer après /marketplace/:id)

### Action #4 — Page `/community` (à coder après Action #3)
- Lister tous les users où `collection_public = true` (3 users actuellement)
- Pour chaque user : avatar/pseudo + nb paires + aperçu de 4 thumbs
- Lien "Voir la collection" → `/u/:pseudo`
- Lien d'accès depuis Dashboard (bouton COMMUNAUTÉ dans toolbar)

## 💡 Lessons learned

- **PowerShell heredocs `@'...'@`** : opening doit être en fin de ligne, closing tout au début (aucun espace avant)
- **Approche robuste pour écrire des fichiers TSX** : `[System.IO.File]::WriteAllText` avec `UTF8Encoding(false)` (pas de BOM)
- **PowerShell `-replace` regex multi-ligne** : utiliser `(?ms)` flag ou backtick-r-n pour newlines
- **`-ExecutionPolicy Bypass`** pour lancer les scripts non signés sans modifier la policy système : `PowerShell -ExecutionPolicy Bypass -File .\script.ps1`
- **Toujours `git branch` avant commit** pour éviter de commit sur main par erreur
- **Le user préfère les scripts PowerShell qui font tout en un coup** plutôt que des patches fragmentés
- **Pas d'outil git automatisé** : le user push manuellement
- **Modal pseudo : `window.location.reload()`** après save pour refresh le profile (sale mais fiable)

## 🧪 Tests à faire

Une fois Action #3 livrée, tester :
- `/u/Layon` → ma page (collection privée → message)
- `/u/Titi` → page de Titi (compte test)
- `/u/inexistant` → page 404
- `/u/LAYON` (majuscule) → doit marcher (ilike case-insensitive)

## 🔗 Données utiles

- **Top users actifs** (à mentionner pour Action #4) :
  - `alexandrenolin_7` (132 paires)
  - `jegr78190` (115)
  - `djallhal.whitehead` (93, J1)
  - `kris.blerald` (90)
  - `alberdienstchine` (70, J1)

## 🌐 URLs et conventions

- Branch dev preview Vercel : `https://shooserie-git-dev-gill-affoums-projects.vercel.app`
- Toujours faire un test en navigation privée pour éviter le cache
- Mobile : pas de devtools facile, donc `alert()` pour debug si besoin

## 🚦 Status actuel à la coupure

- ✅ Action #1 (WelcomeHeader) : commit + push sur dev OK
- ✅ Action #2 (AppHeader pseudo) : commit + push sur dev OK
- ⏳ Action #3 (UserProfile) : pas commencée — specs validées (B/C+filtre/A/A)
- ⏳ Action #4 (Community) : pas commencée
- ⚠️ Pas encore mergé dev → main aujourd'hui (à faire en fin de journée)