# Design System — Work Class Gabon

## Principes

1. **Mobile-first** : design pensé pour mobile, étendu vers desktop.
2. **A11y AA** : contrastes WCAG AA, focus visible, navigation clavier complète.
3. **Tokens centralisés** : aucune valeur en dur dans les composants — tout vient de `src/design-system/tokens/`.
4. **shadcn/ui non modifié** : toute customisation passe par `design-system/patterns/`.

## Tokens

| Token        | Fichier                                          |
|--------------|--------------------------------------------------|
| Couleurs     | `src/design-system/tokens/colors.ts`             |
| Typographie  | `src/design-system/tokens/typography.ts`         |
| Espacement   | `src/design-system/tokens/spacing.ts`            |
| Bordures     | `src/design-system/tokens/borders.ts`            |
| Ombres       | `src/design-system/tokens/shadows.ts`            |
| Radii        | `src/design-system/tokens/radii.ts`              |
| Transitions  | `src/design-system/tokens/transitions.ts`        |
| z-index      | `src/design-system/tokens/z-index.ts`            |
| Breakpoints  | `src/design-system/tokens/breakpoints.ts`        |

## Palette de marque

- **Primaire** : `#0066CC` (bleu Work Class)
- **Secondaire** : `#FF6B00` (orange accent)
- **Sémantique** : success `#22C55E`, warning `#F59E0B`, error `#EF4444`, info `#3B82F6`.

## Hiérarchie atomique

```
design-system/
├── tokens/        # Valeurs primitives
├── themes/        # light / dark
├── patterns/      # Compositions (buttons, forms, cards, navigation, feedback)
├── components/    # Atoms → Molecules → Organisms
└── templates/     # Templates pleins-écran (Event, Reservation, AdminDashboard, Scan)
```

## Règles d'usage

- Toujours utiliser `cn()` (de `design-system/utils/cn.ts`) pour fusionner les classes Tailwind.
- Respecter `prefers-reduced-motion` (déjà géré dans `styles/animations.css`).
- Pour les états : `aria-live`, `role=status`, `role=alert` selon le contexte.
