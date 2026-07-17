# Shooserie — logos (direction « boîte étiquetée » / 3c)

Trois thèmes couleur, chacun en **lockup** (mark + wordmark) et **icon** (app / favicon / avatar).

```
logo/
├── shooserie-lockup-dark.svg        # wordmark blanc — à poser sur fond sombre
├── shooserie-icon-dark.svg          # tuile noire + boîte blanche
├── shooserie-lockup-light.svg       # wordmark noir — à poser sur fond clair
├── shooserie-icon-light.svg
├── shooserie-lockup-southbeach.svg  # édition Miami
└── shooserie-icon-southbeach.svg
```

## Couleurs
| Rôle | Hex |
|---|---|
| Noir | `#0A0A0A` |
| Blanc | `#FFFFFF` |
| Bred red (accent défaut) | `#CE1141` |
| Turquoise (South Beach) | `#10CFC6` |
| Pink flash (South Beach) | `#FF3E9A` |

Les deux « O » et deux barres du code-barres portent l'accent du thème.

## Typo
Wordmark = **Outfit** 800 (letter-spacing ≈ -0.035em). Le SVG référence la police par `font-family`, donc :
- Dans l'app / le site (Outfit déjà chargé) → rendu correct tel quel.
- Pour un usage hors-ligne (favicon, email, impression) → **vectoriser le texte** (Illustrator/Inkscape : « Objet → Vectoriser le texte ») pour figer les glyphes. Les icônes n'ont pas de texte et sont sûres partout.

## Intégration rapide (favicon)
```bash
cp logo/shooserie-icon-dark.svg public/favicon.svg
```
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="theme-color" content="#0A0A0A" />
```
