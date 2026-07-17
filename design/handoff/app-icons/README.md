# Shooserie — icônes app (3 systèmes)

Trois familles au **traitement graphique distinct** (règle anti-confusion, LOT 4 du brief).
Palette Bred : noir `#0A0A0A` · rouge `#CE1141` · blanc `#FFFFFF`. Tous en SVG vectoriel.

**Deux thèmes.** Chaque icône existe en version **Clair** (à poser sur fond clair) et **Sombre**
(suffixe `-dark`, à poser sur fond sombre). Ex. `rang-1-rookie.svg` / `rang-1-rookie-dark.svg`.
Sélectionne le fichier selon le thème actif de l'app.

```
app-icons/
├── rangs/        7 écussons militaires (galons + étoiles)   88×97   ×2 thèmes
├── badges/       7 tuiles pictogramme archétype             88×88   ×2 thèmes
└── facettes/     5 chips pilule en contour                  72×44   ×2 thèmes
```

## Rangs (activité — registre militaire) · `svgPath` écusson
| Fichier | Rang | Niveau |
|---|---|---|
| `rangs/rang-1-rookie.svg` | Rookie | 1 |
| `rangs/rang-2-soldier.svg` | Soldier | 2 |
| `rangs/rang-3-sergeant.svg` | Sergeant | 3 |
| `rangs/rang-4-lieutenant.svg` | Lieutenant | 4 |
| `rangs/rang-5-grail-captain.svg` | Grail Captain | 5 |
| `rangs/rang-6-colonel.svg` | Colonel | 6 |
| `rangs/rang-7-general-og.svg` | General OG | 7 |

> Le fichier de constante des rangs n'existe pas encore dans le repo (le brief le décrit comme « à exposer »). Ces 7 paliers suivent l'échelle Rookie → General OG mentionnée, avec « Grail Captain » au niveau 5. Ajuste les libellés si ta constante définitive diffère.

## Badges (type de collectionneur — nb paires) · mappe `BADGES` de `badges.ts`
| Fichier | `code` | Label affiché | Paires |
|---|---|---|---|
| `badges/badge-1-lurker.svg` | `LURKER` | Lurker | 0 |
| `badges/badge-2-beater.svg` | `BEATER_CASUAL` | Beater | 1–5 |
| `badges/badge-3-initiated.svg` | `INITIATED_ON_FEET` | Initié | 6–15 |
| `badges/badge-4-rotation.svg` | `ROTATION_SPECIALIST` | Rotation | 16–40 |
| `badges/badge-5-rockstock.svg` | `ROCK_OR_STOCK` | Rock or Stock | 41–80 |
| `badges/badge-6-legit-checker.svg` | `GRAIL_HUNTER` | **Legit Checker** | 81–150 |
| `badges/badge-7-king.svg` | `SOLE_PROVIDER` | King | 151+ |

> Le badge 6 utilise le nouveau label **« Legit Checker »** (renommage figé du brief). Le `code` interne `GRAIL_HUNTER` reste inchangé — pointe `svgPath` vers `badge-6-legit-checker.svg`.

## Facettes (traits de la collec — données) · mappe `FACETS` de `badges.ts`
| Fichier | `code` | Label | Condition |
|---|---|---|---|
| `facettes/facette-brand-diversity.svg` | `BRAND_DIVERSITY` | Brand Diversity | 4+ marques |
| `facettes/facette-value-connoisseur.svg` | `VALUE_CONNOISSEUR` | Value Connoisseur | cote moy. > 250€ |
| `facettes/facette-active-wearer.svg` | `ACTIVE_WEARER` | Active Wearer | 50%+ portées |
| `facettes/facette-pure-collector.svg` | `PURE_COLLECTOR` | Pure Collector | 90%+ en DS |
| `facettes/facette-resell-game.svg` | `RESELL_GAME` | Resell Game | 10%+ en vente |

## Intégration
Copie `app-icons/` dans `public/` puis référence par chemin, ou importe les SVG comme composants.
Les 3 silhouettes (écusson / tuile / pilule) sont volontairement différentes : ne jamais réutiliser
le traitement d'un système pour un autre.
