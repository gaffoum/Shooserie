# Shooserie

Application de gestion de collection de sneakers — design Jordan OG, mode clair, mobile-first.

## Stack

- **Vite 5** + **React 18** + **TypeScript** (strict)
- **Supabase** (Auth email/password + Postgres + RLS + Storage)
- **React Router 6**
- **@tanstack/react-query** (cache + mutations + invalidation)
- Typo : **Outfit** (display) + **Inter** (body)

## Ce qui marche (Phase 1 + Phase 2 + Phase 4)

### Phase 1
- Login email + mot de passe (toggle inscription / connexion)
- Routes protégées + déconnexion
- Design system Jordan OG (palette Bred Red, Royal, University, etc.)
- DB Supabase prête (table `sneakers`, RLS active, Storage bucket `sneaker-photos`)

### Phase 2
- **Dashboard** avec KPI réels calculés (paires, valeur release, cote actuelle, +/- value avec %)
- Sparkline en filigrane sur la carte plus-value (placeholder statique, vraies données Phase 3)
- **Grille de cartes** (vue vignettes) + **vue table** avec toggle
- **Filtre par marque** (chips)
- Tri par +/- value décroissant par défaut
- **CRUD complet** :
  - Ajouter une paire (`/sneakers/new`) — formulaire complet avec sections
  - Voir une fiche (`/sneakers/:id`) — vue détaillée avec grid prix Release/Cote/+€/+%
  - Modifier (`/sneakers/:id/edit`) — formulaire pré-rempli
  - Supprimer — avec dialog de confirmation, supprime aussi la photo dans Storage
- **Upload photo manuelle** vers bucket privé Supabase Storage, URLs signées générées à la demande
- Validation client (nom obligatoire, types corrects, traduction FR des erreurs Supabase)

### Phase 4 — Scan code-barre + lookup auto
- Composant `BarcodeScanner` plein écran via `html5-qrcode` (lazy-loadé, chunk séparé ~100 kB)
- Supporte EAN-13/8, UPC-A/E, Code128, Code39, QR
- Bouton **Scanner** dans le header du Dashboard
- Bouton **Scan** compact à côté du champ SKU dans le formulaire
- Heuristique simple : si le code contient des lettres → SKU, sinon → barcode
- **Auto-lookup via UPCitemdb** (free trial, 100 req/jour, sans clé) après détection :
  - Edge Function `barcode-lookup` proxy + normalisation
  - Pré-remplit `name`, `brand`, `colorway`, `stockx_image_url` si trouvé
  - Filtre les images HTTPS uniquement (évite mixed-content)
  - Badge UI "Pré-rempli depuis UPCitemdb" pour transparence
- Permissions caméra gérées (message clair si refusé)
- Fallback **saisie manuelle** si caméra indispo / refusée
- Mobile-first : safe-area iOS, viewport full-height

## Phase 3 — en attente

Le scraping StockX direct est bloqué par Cloudflare (testé via Edge Function `stockx-probe`).
La Phase 3 sera activée dès qu'un accès à l'API officielle StockX est obtenu.
Sont prêts à recevoir les données :
- Sparkline KPI plus-value
- Recherche autocomplete dans le formulaire
- Auto-fill scan → fiche
- Bouton "Actualiser la cote"

## Développement local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5174

## Build & déploiement

```bash
npm run build      # build prod
npm run typecheck  # vérif TS uniquement (sans build assets)
vercel --prod      # déploie en prod
```

## Config Supabase requise

Dans le dashboard Supabase :

**Authentication → Providers → Email**
- `Confirm email` = **OFF** (sinon `signUp` bloque)
- `Allow new users to sign up` = **OFF** une fois ton compte créé (sécurité)

**Authentication → URL Configuration**
- `Site URL` : `https://shooserie.vercel.app`
- `Redirect URLs` : `http://localhost:5174/**`, `https://shooserie.vercel.app/**`

## Structure

```
src/
├── lib/
│   ├── supabase.ts       Client Supabase (clés fallback hardcodées, RLS sécurise)
│   ├── queries.ts        Hooks React Query (read/write/storage) + uploadSneakerPhoto
│   ├── format.ts         Helpers € / % / date / agrégation KPIs
│   └── types.ts          Interface Sneaker
├── contexts/
│   └── AuthContext.tsx   Session state global
├── components/
│   ├── AppHeader.tsx     Header sticky avec backdrop-filter
│   ├── BackLink.tsx
│   ├── BrandFilter.tsx   Chips de filtre
│   ├── ConfirmDialog.tsx Dialog modal de confirmation
│   ├── EmptyState.tsx
│   ├── KpiCard.tsx       Carte KPI avec slot sparkline
│   ├── Logo.tsx          SHOOSERIE wordmark + point rouge
│   ├── PhotoPlaceholder.tsx  Silhouette sneaker SVG fallback
│   ├── ProtectedRoute.tsx
│   ├── SneakerCard.tsx   Carte grille vignettes
│   ├── SneakerForm.tsx   Form réutilisable add/edit
│   ├── SneakerPhoto.tsx  Affiche photo (StockX direct ou signed URL Storage)
│   ├── SneakerTable.tsx  Vue tableau
│   ├── Sparkline.tsx     SVG sparkline placeholder
│   └── ViewToggle.tsx    Toggle grille/table
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── SneakerNew.tsx
│   ├── SneakerDetail.tsx
│   └── SneakerEdit.tsx
├── styles/
│   └── tokens.css        Variables CSS (couleurs, espacements, radius, transitions)
├── App.tsx               Routes
├── main.tsx              Entry point + QueryClient
└── index.css             Reset + base styles
```

## Limites connues

- **Pas de compression photo** côté client — Supabase Storage accepte jusqu'à 50 MB/fichier sur le plan Free, mais sur mobile une photo brute peut peser 5+ MB. À optimiser en Phase 4 (canvas resize avant upload).
- **Sparkline statique** — sera alimentée par les vraies cotes en Phase 3 quand on aura le polling StockX.
- **Pas de retry visible** en cas d'échec d'upload — l'erreur s'affiche, l'utilisateur doit relancer manuellement.
- **Cache photos privées** : URLs signées avec TTL 1h, refresh à 50min via React Query. Si l'app reste ouverte > 1h sans navigation, les photos peuvent se "casser" temporairement (un refresh suffit).
