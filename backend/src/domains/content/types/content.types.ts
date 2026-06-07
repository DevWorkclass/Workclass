/**
 * Types du domaine content (contenu éditable du site public).
 */

export type ThemeIcon = 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket' | 'globe';

/** Un domaine/thème de la page d'accueil, illustrable par une image. */
export interface HomeTheme {
  icon: ThemeIcon;
  title: string;
  description: string;
  /** URL publique de l'image d'illustration (optionnelle → fallback dégradé). */
  imageUrl?: string;
}

/** Clé de stockage dans `site_settings`. */
export const HOME_THEMES_KEY = 'home_themes';

/**
 * Valeurs par défaut (miroir de `frontend/src/data/homepageContent.ts`).
 * Servies tant qu'aucune personnalisation n'a été enregistrée.
 */
export const DEFAULT_HOME_THEMES: HomeTheme[] = [
  {
    icon: 'briefcase',
    title: "01 · L'agripreneur et sa structure",
    description: 'Structuration juridique, business plan, coopérative et financement ANPI.',
  },
  {
    icon: 'lightbulb',
    title: '02 · La réglementation selon les destinations',
    description: "ZLECAf · UE (RDUE / MACF) · Asie (GACC) : maîtriser les règles d'accès aux marchés.",
  },
  {
    icon: 'rocket',
    title: '03 · Transport, emballage & Incoterms',
    description:
      "Choix de l'Incoterm, emballage export, transitaire agréé et schéma logistique gabonais.",
  },
  {
    icon: 'globe',
    title: '04 · Opportunités & Marchés',
    description:
      'ZLECAf, accords CEMAC-UE et stratégies de positionnement sur les marchés africains et internationaux.',
  },
];
