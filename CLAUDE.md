# CLAUDE.md — Shooserie

Guide de travail pour ce dépôt. Collection de sneakers + marketplace + stickers/commandes + social, React/TS sur Vite, backend Supabase, déploiement Vercel.

## Stack

- **Front** : React 18 + TypeScript, build **Vite** (`npm run dev` / `build` / `preview` / `typecheck`).
  - `build` = `tsc -b && vite build` → toute erreur TS casse le build. Lancer `npm run typecheck` avant de committer.
- **Routeur** : `react-router-dom` v6 (`BrowserRouter`) dans `src/App.tsx`.
- **Données** : `@tanstack/react-query` + `@supabase/supabase-js`.
- **Divers** : `jspdf` + `qrcode` (stickers PDF), `html5-qrcode` (scan code-barres).

## Discipline de branches

- Travail sur **`dev`**. **`main`** = branche de release et cible des PR.
- Ne jamais committer/pusher sans demande explicite. Si on est sur `main`, créer une branche d'abord.
- `origin` héberge `dev` et `main`.

## Format des commits (français)

Conventional Commits **en français**, message au présent, scope entre parenthèses :

```
feat(admin): email d'expédition Resend (Lot 3b)
fix(orders): URL fonction Supabase en dur + parsing robuste
copy(labels): hint tarif sur 2 lignes
```

Types observés : `feat`, `fix`, `copy` (textes/wording). Scopes courants : `admin`, `orders`, `labels`.

Fin de message de commit :
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

## Workflow par « Lots »

Le travail est découpé en **Lots** numérotés (`Lot 1`, `Lot 2`, `Lot 3`, `Lot 3b`…), référencés dans les messages de commit. Chaque lot a souvent un script PowerShell dédié à la racine (`lot3-admin.ps1`, `lot3b-notify.ps1`, `fix-order-url.ps1`…) qui applique les changements. Ces scripts sont des artefacts de génération, pas la source de vérité — le code appliqué vit dans `src/`.

## Structure : `src/` fait foi, la racine contient des doublons

⚠️ **Seul `src/` est buildé.** La racine du dépôt contient d'anciennes copies obsolètes de composants/pages (`App.tsx`, `SneakerCard.tsx`, `queries.ts`, `types.ts`, etc.) qui **ne sont pas** celles utilisées. Toujours éditer sous `src/`, jamais les fichiers `.tsx`/`.ts` de la racine.

```
src/
  App.tsx            routeur + AuthProvider + guards
  pages/             écrans (Dashboard, Marketplace, Admin, AdminOrders, Labels…)
  components/        UI réutilisable + guards (ProtectedRoute, AdminGuard, PseudoSetupGuard)
  contexts/          AuthContext.tsx
  lib/               accès données (queries.ts, admin.ts, adminOrders.ts, stickerOrders.ts, supabase.ts…)
  i18n/              I18nContext.tsx + dictionaries.ts
  styles/tokens.css  design tokens (palette, couleurs)
supabase/            migrations + Edge Functions
```

## Supabase

- **Projet** : `eykhnpnmpcrvcpajirst` (`https://eykhnpnmpcrvcpajirst.supabase.co`).
- Client instancié une seule fois dans `src/lib/supabase.ts` (URL + clé *publishable* en fallback hardcodé ; sécurité réelle = policies **RLS**).
- **Bucket photos** : `sneaker-photos`, **privé** — les URLs doivent passer par des signed URLs, pas d'accès public direct.
- **Migrations** : additives et versionnées sous `supabase/`. Ne pas casser le schéma existant ; préférer une migration additive.

## i18n

- Hook : `const { t } = useT()` (aussi `lang`, `setLang`, `toggleLang`).
- `t('cle.plate', { var: valeur })` — **clés plates** en dot-notation (`'dashboard.scan.duplicate.confirmOne'`, `'common.save'`), définies dans `src/i18n/dictionaries.ts`.
- Langues : `fr` (défaut/fallback) et `en`. Toute chaîne visible passe par `t()` — ajouter la clé dans les deux dictionnaires.

## Design / palette « Bred »

Tokens dans `src/styles/tokens.css`, à utiliser via `var(--…)` (jamais de hex en dur) :

- `--color-bred` **#CE1141** — accent principal & plus-values
- `--color-royal` **#1D428A** — accents secondaires
- `--color-university` #75B2DD — hover/highlight
- `--color-up` / `--color-down` — variations de cote (vert/rouge)

## État des chantiers

- ✅ **Activation faite** : `CommunityPreview` + leaderboard affichés dans **l'état vide du Dashboard** (onboarding social quand la collection est vide).
- ⏳ **TCG / rareté** : en attente d'une **migration additive** Supabase avant implémentation. Ne pas coder le front tant que le schéma n'est pas migré.
