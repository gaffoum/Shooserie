# Chantiers à appliquer — préparé pendant la nuit

Trois sujets, ordre d'application recommandé :

1. [Logo + favicons](#1-logo--favicons) — 5 min, choix + commit
2. [Migration vers `shooserie.tech`](#2-migration-vers-shooserietech) — 15 min, DNS + Vercel + Supabase
3. [Templates emails Supabase](#3-templates-emails-supabase) — 5 min, copier-coller

Tout est déjà préparé dans `/branding/`. Rien à coder de plus.

---

## 1) Logo + favicons

### Deux options préparées

**Option A — Monogramme `S`** (fichier `branding/option-a-monogram.svg`)
- Carré arrondi noir, lettre S blanche, point Bred dans le coin
- Marche à toutes les tailles, parfait en favicon
- Compact, identifiable, mobile-first

**Option B — Silhouette sneaker + wordmark** (fichier `branding/option-b-sneaker-wordmark.svg`)
- Sneaker latérale (style AJ1) à gauche en blanc sur noir
- Wordmark `SHOOSERIE` à droite, point Bred final
- Plus illustratif, plus narratif — convient mieux à un header/site web large

Mon avis : **A pour l'app + favicon**, **B pour la page marketing / signature email / réseaux sociaux** si tu en fais une un jour. Les deux partagent les mêmes couleurs et la même typo donc cohérence garantie.

### Si on choisit A demain, voici ce qu'on fait

Les fichiers `branding/favicon.svg` et `branding/apple-touch-icon.svg` sont déjà prêts (variantes optimisées pour ces tailles). Demain on les copie dans `/public/` et on update le `index.html` pour les référencer :

```bash
cp branding/favicon.svg public/favicon.svg
cp branding/apple-touch-icon.svg public/apple-touch-icon.svg
```

Puis dans `index.html`, remplacer la balise `<link rel="icon" ...>` actuelle par :

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
<link rel="mask-icon" href="/favicon.svg" color="#0A0A0A" />
<meta name="theme-color" content="#0A0A0A" />
```

Note : le composant `Logo.tsx` interne à l'app reste inchangé (wordmark `SHOOSERIE.` actuel). Les favicons sont indépendants — c'est ce qui apparaît dans l'onglet du navigateur et sur le home screen iOS. Si tu veux refondre le `Logo.tsx` lui-même pour utiliser l'option B (avec sneaker), on le fait en supplément demain.

---

## 2) Migration vers `shooserie.tech`

Pré-requis : avoir le domaine acheté chez un registrar (OVH, Namecheap, Gandi, Cloudflare, etc.).

### Étape 2.1 — Ajouter le domaine sur Vercel

1. Dashboard Vercel → projet `shooserie` → **Settings → Domains**
2. Cliquer "Add Domain" → entrer `shooserie.tech`
3. Vercel proposera aussi d'ajouter `www.shooserie.tech` → accepter (avec redirection 308 vers la racine, c'est le comportement par défaut, parfait)
4. Vercel affiche les enregistrements DNS à configurer chez le registrar

### Étape 2.2 — Configurer les DNS chez le registrar

Vercel demandera typiquement :
- **`A` record** pour `shooserie.tech` → `76.76.21.21` (IP Vercel)
- **`CNAME` record** pour `www` → `cname.vercel-dns.com`

⚠️ Si le registrar c'est **Cloudflare**, mettre le proxy en mode **"DNS only"** (nuage gris), pas en mode proxy (orange) — sinon Vercel ne pourra pas émettre le certificat SSL.

Propagation DNS : généralement 5-30 min, parfois jusqu'à 24h. Vercel vérifie automatiquement.

### Étape 2.3 — Définir `shooserie.tech` comme domaine principal

Dans Vercel → Settings → Domains : cliquer les "..." à côté de `shooserie.tech` → "Set as Production Domain". L'ancien `shooserie.vercel.app` continue de marcher (redirection auto vers shooserie.tech).

### Étape 2.4 — Update Supabase

Dashboard Supabase (projet Shooserie, `eykhnpnmpcrvcpajirst`) → **Authentication → URL Configuration** :

- **Site URL** : remplacer `https://shooserie.vercel.app` par `https://shooserie.tech`
- **Redirect URLs** (additive list) : ajouter
  - `https://shooserie.tech/reset-password`
  - `https://shooserie.tech/**` (wildcard, pratique pour le futur)
  - **Garder l'ancien** `https://shooserie.vercel.app/reset-password` pendant 2-3 jours pour ne casser aucun lien email déjà envoyé

### Étape 2.5 — Vérifier qu'aucune URL n'est cassée

Le code n'utilise nulle part `shooserie.vercel.app` en dur — vérifié. Les `redirectTo` du reset password utilisent `window.location.origin` donc s'adaptent au domaine actif automatiquement. Les edge functions Supabase (StockX OAuth, barcode lookup) ne référencent que `accounts.stockx.com` et `api.stockx.com`, rien de propre à Vercel.

Une seule chose à tester après migration :
1. Ouvrir `https://shooserie.tech` → login
2. Cliquer "Mot de passe oublié" → envoyer le mail
3. Vérifier que le lien dans l'email pointe bien vers `https://shooserie.tech/reset-password`

---

## 3) Templates emails Supabase

Trois templates HTML brandés sont dans `branding/email-templates/`. À coller dans Supabase **après** avoir fait la migration de domaine (sinon les URLs `{{ .SiteURL }}` afficheraient l'ancien domaine).

### Étape 3.1 — Reset Password (le plus critique)

Dashboard Supabase → **Authentication → Email Templates → "Reset Password"** :

- **Subject** : `Reset your Shooserie password`
- **Message body** : coller le contenu de `branding/email-templates/reset-password.html`

### Étape 3.2 — Change Email Address

Même endroit, template **"Change Email Address"** :

- **Subject** : `Confirm your new Shooserie email`
- **Message body** : coller le contenu de `branding/email-templates/change-email.html`

### Étape 3.3 — Confirm Signup (optionnel — uniquement si tu actives la confirmation)

Si tu décides à un moment d'exiger que les nouveaux comptes confirment leur email avant connexion, le template **"Confirm Signup"** est aussi prêt : `branding/email-templates/confirm-signup.html` (sujet `Welcome to Shooserie — confirm your email`).

Pour l'activer : Auth → Providers → Email → toggler **"Confirm email"** ON. Pour l'instant c'est OFF (les nouveaux comptes sont actifs immédiatement, plus simple pour le test).

### Note sur la langue des emails

Supabase ne supporte qu'un seul template par type d'email. Les templates préparés sont en **anglais** vu que tu ouvres l'app à des collectionneurs étrangers. Si tu veux du français, dis-le demain, je traduis en 30 secondes (les contenus sont courts). On peut aussi faire du bilingue dans le même email (FR + EN séparés par un divider) — c'est ce que font pas mal d'apps européennes.

---

## Récap des fichiers ajoutés cette nuit

```
branding/
├── option-a-monogram.svg             ← Logo carré S
├── option-b-sneaker-wordmark.svg     ← Logo sneaker + wordmark
├── favicon.svg                       ← Favicon 32x32 SVG
├── apple-touch-icon.svg              ← Icône home screen iOS 180x180
├── email-templates/
│   ├── reset-password.html           ← À coller dans Supabase
│   ├── change-email.html             ← À coller dans Supabase
│   └── confirm-signup.html           ← Réserve (si activation future)
└── README.md                         ← Ce fichier
```

Ces fichiers ne sont pas inclus dans le build — ils vivent à la racine du repo comme assets sources. Quand on commit, ils restent dans le repo. Demain on copie ceux dont on a besoin dans `/public/`.

---

Dors bien — on reprend tout ça demain. Si une étape déconne (DNS qui ne propage pas, Vercel qui refuse le domaine, etc.), ping-moi en m'envoyant le message d'erreur et on debug.
