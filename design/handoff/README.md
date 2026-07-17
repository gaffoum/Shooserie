# Handoff : Shooserie — application mobile (collection de sneakers)

## Overview
Shooserie est une PWA mobile de gestion de collection de sneakers, orientée sneakerhead/communauté, avec une mécanique « carte à collectionner » (TCG). Ce bundle contient les maquettes haute-fidélité de **toutes les pages de l'application**, en thème **Dark** et thème **Light**, direction visuelle « carte TCG » (palette Jordan Bred).

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML** (`.dc.html`) — des prototypes montrant l'apparence et le comportement voulus, **pas du code de production à copier tel quel**. La tâche est de **recréer ces designs dans l'environnement du codebase cible** (React Native / Expo, React PWA, SwiftUI, etc.) en suivant ses patterns et sa librairie de composants existants. S'il n'existe pas encore d'environnement, choisir le framework le plus adapté (une PWA mobile-first en React est cohérente avec l'intention) et y implémenter les designs.

Les `.dc.html` sont des « Design Components » : ils s'ouvrent directement dans un navigateur. Chaque page est une `<section>` contenant un cadre téléphone `.scr` de **390 × 844 px** (mobile-first). Le style est **100 % inline**. Pour visualiser : ouvrir le fichier dans un navigateur (les fichiers `support.js`, `image-slot.js` et le dossier `app-icons/` doivent rester à côté).

## Fidelity
**High-fidelity (hifi).** Couleurs, typographie, espacements, rayons et interactions sont définitifs. Recréer l'UI au pixel près avec les composants du codebase. Les photos de sneakers sont des emplacements (`<image-slot>`) / puits de lumière à remplir avec les vraies images produit.

## Design Tokens

### Couleurs — palette « Jordan Bred »
| Rôle | Hex |
|---|---|
| Rouge accent principal (CTA, actif, FAB) | `#CE1141` |
| Rouge hover/clair | `#E8657F` |
| Bleu Royal (accent secondaire) | `#1D428A` |
| Bleu clair label (Dark) | `#9FB4DD` / (Light) `#33589F` |
| Noir fond (Dark) | `#0A0A0A` |
| Fond page canvas (Dark) | `#0A0A0A` / (Light) `#ECECEC` |
| Surface carte (Dark) | `#FFFFFF` cadre / wells `#111` · (Light) `#FFFFFF` |
| Texte principal (Dark) | `#F2F2F2` / (Light) `#141414` |
| Texte secondaire / muted | `#8A8A8A`, `#6C6C6C` |
| Vert succès / gain | `#4ADE80` |
| Or holographique (grail) | dégradé `#F6C560 → #FFF6D0 → #E7A93C → #FDE9A6` (Light texte or : `#9A7B1E`) |

### Système de rareté « métaux »
| Rareté | Couleur bord/badge |
|---|---|
| Commune | acier `#4B5563` |
| Peu commune | bronze `#B87333` |
| Rare | argent `#C0C0C0` |
| Ultra rare | bleu roi `#1D428A` |
| Grail | or holographique (dégradé animé, voir `@keyframes holoShift`) |

### Typographie
- **Titres / chiffres** : `Outfit` (700–900), letter-spacing négatif (-0.4 à -1px) sur les gros titres.
- **Labels / mono / codes** : `Space Mono` (classe `.lab`), letter-spacing 1–2px, uppercase.
- Échelle mobile : titres 24–34px, sous-titres 17–19px, corps 13–15px, labels 9–12px. Minimum tactile 44px.

### Espacements & rayons
- Cadre téléphone : radius 44px. Cartes/surfaces : 11–18px. Pilules : 100px. Boutons : 13–16px.
- Barre de nav basse : hauteur 74px (réserver 82–96px de padding-bottom au contenu scrollable).
- Zones tactiles ≥ 44px.

### Ombres / effets
- Grail : dégradé conique/linéaire animé (`@keyframes holoShift`, 6s) + halo `box-shadow`.
- Flottement produit : `@keyframes floatY` (6s). Halo rouge sous la sneaker : `@keyframes ringPulse`.
- Skeleton chargement : dégradé + `holoShift` 1.4s.

## Navigation (5 destinations + FAB central)
Barre basse persistante : **Collection · Communauté · [＋ Ajouter (FAB rouge)] · Marketplace · Profil**. L'onglet actif est en `#CE1141`, inactifs en `#6C6C6C`.

## Screens / Views
Chaque écran fait 390×844, statusbar en haut, barre de nav en bas (sauf modales/auth/scan).

**Collection**
- **Portfolio (Ma collection)** : header nb paires, bannière valeur estimée (+%), chips filtres, grille 2 col de cartes-rareté (bord métal + prix).
- **Collection TCG (classeur)** : progression série (18/24, barre), grille binder 6 cartes (possédées + verrouillées 🔒), bandeau « Prochaine carte ».
- **Détail paire** : LA carte TCG holographique (grail) — badge rareté, photo héros, cote/retail, taille/US/état DS, histoire ; actions Éditer / Porter / Mettre en vente.
- **Éditer paire** : formulaire (photo, modèle, taille, prix payé, état DS/VNDS/Used, visibilité, supprimer).
- **Mes stats** : carte rang (écusson), tuiles 2×2 (paires/grails/marques/portées), facettes débloquées.

**Communauté**
- **Leaderboard** : podium top 3, lignes classées, ligne « Toi » surlignée.
- **Découvrir** : feed d'activité (ajout grail, port de paire) avec cartes.
- **Profil public /u:pseudo** : cover dégradé, avatar + rang, Suivre, stats, grille 3×3 (dont tuile « +N voir tout »), pleine largeur.

**Ajouter**
- **Ajout manuel** : upload photo, recherche modèle (résultats avec SKU + cote), taille/état, Continuer.
- **Scan code-barres** : écran caméra (reste sombre dans les 2 thèmes), viseur, pilule paire détectée.

**Marketplace**
- **Parcourir** : recherche + filtres, grille annonces (rareté, prix, favori).
- **Détail annonce** : héros photo, prix vs cote, specs, vendeur vérifié, Acheter.
- **Messagerie** : fil de discussion acheteur/vendeur.
- **Mes ventes (+ étiquettes)** : annonces en cours (vues), vendue → éditer étiquette d'envoi, gains du mois.
- **Mes achats** : suivi commande (payé/expédié/reçu), statuts.

**Profil**
- **Mon profil** : cover, avatar + rang, stats, liste (progression, parrainage, partage, paramètres).
- **Ma progression** : écusson rang + barre, rail de badges, prochain palier.
- **Parrainage** : code, filleuls/gains, partager.
- **Paramètres** : compte, préférences (thème sombre = ON/OFF selon build, notifs, langue), à propos, déconnexion.
- **Partage collec** : carte holographique partageable (stats + QR + URL).

**Hors navigation**
- **Connexion**, **Reset mot de passe**, **Callback auth** (transition/loader), **CGV**, **Guide & aide** (les 4 systèmes), **Admin** (dashboard), **Admin commandes** (litiges).

**États** : Collection vide, Chargement (skeleton), Aucun résultat, Hors-ligne/erreur.

## Interactions & Behavior
- FAB central `＋` → flux Ajouter. Onglets → destinations.
- Grail : dégradé holographique animé (shimmer + balayage) — élément clé désirable.
- Grilles de cartes : s'adaptent à l'espace entre en-tête et barre basse (flex column, grille `flex:1` OU flux naturel selon l'écran — cf. Profil public et Classeur).
- Toggle thème (Paramètres) commute Dark/Light (les 2 builds fournis).
- États chargement/vide/erreur fournis comme écrans dédiés.

## State Management (indicatif)
- `theme` (dark/light), `collection[]` (paires : modèle, taille, état, prix payé, cote, rareté, photo, visible), `user` (rang, badges, facettes, stats), `marketplace` (annonces, panier, messages, commandes), `filters`, `loading/error/empty` par vue.

## Assets
- **Icônes rangs/badges/facettes** : SVG fournis dans `app-icons/` (variantes `-dark.svg` pour fond sombre, `.svg` pour fond clair). Mapping complet dans `app-icons/README.md` (rangs Rookie→General OG, badges Lurker→King, facettes). Utiliser tels quels.
- **Logo Shooserie** : inline SVG (boîte à chaussures + code-barres, 2 O rouges) présent dans les écrans Connexion/Callback ; sources complètes dans `logo/`.
- **Photos sneakers** : emplacements `<image-slot>` / puits de lumière → remplir avec les vraies images produit.
- **Polices** : Outfit + Space Mono (Google Fonts).

## Files
- `Shooserie App.dc.html` — toutes les pages, thème **Dark**.
- `Shooserie App Light.dc.html` — toutes les pages, thème **Light** (miroir).
- `app-icons/` — icônes SVG (rangs, badges, facettes) + README de mapping.
- `logo/` — lockups & icônes du logo (3 thèmes).
- `support.js`, `image-slot.js` — runtime nécessaire pour ouvrir les `.dc.html` dans un navigateur.

> Note : le Dark est la source de vérité ; le Light en est dérivé (même structure, palette inversée, icônes en variante claire).
