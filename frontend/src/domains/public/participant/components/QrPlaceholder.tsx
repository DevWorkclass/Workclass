/**
 * Aperçu visuel d'un QR code — rendu décoratif, déterministe et SSR-safe.
 *
 * NOTE: ce composant n'encode PAS une valeur scannable. Le vrai QR signé (HMAC)
 * est généré côté backend et fourni via `Ticket.qrCode`. Tant que l'API n'est
 * pas câblée, on affiche un motif stable dérivé du numéro de billet.
 */

interface QrPlaceholderProps {
  /** Graine du motif (ex. numéro de billet). */
  value: string;
  /** Côté du rendu en pixels. */
  size?: number;
  /** Couleur des modules. */
  color?: string;
  className?: string;
  title?: string;
}

/** Hash FNV-1a 32 bits — stable client/serveur. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Bit pseudo-aléatoire déterministe pour une cellule (r, c). */
function isModuleOn(seed: number, r: number, c: number): boolean {
  let x = (seed ^ Math.imul(r + 1, 0x9e3779b1) ^ Math.imul(c + 1, 0x85ebca77)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2545f491) >>> 0;
  x ^= x >>> 13;
  return (x & 1) === 1;
}

const GRID = 25; // nombre de modules par côté
const FINDER = 7; // taille du motif de repère (coins)

/** Indique si (r, c) appartient à un motif de repère de coin. */
function inFinder(r: number, c: number): boolean {
  const near = (a: number, b: number) => a >= b && a < b + FINDER;
  return (
    (near(r, 0) && near(c, 0)) ||
    (near(r, 0) && near(c, GRID - FINDER)) ||
    (near(r, GRID - FINDER) && near(c, 0))
  );
}

export function QrPlaceholder({
  value,
  size = 200,
  color = '#0D2145',
  className,
  title = 'QR code du billet',
}: QrPlaceholderProps) {
  const seed = fnv1a(value);
  const modules: { r: number; c: number }[] = [];

  for (let r = 0; r < GRID; r += 1) {
    for (let c = 0; c < GRID; c += 1) {
      if (inFinder(r, c)) continue;
      if (isModuleOn(seed, r, c)) modules.push({ r, c });
    }
  }

  // Motifs de repère (coins) — anneau plein 7x7 avec centre 3x3.
  const finders = [
    { x: 0, y: 0 },
    { x: GRID - FINDER, y: 0 },
    { x: 0, y: GRID - FINDER },
  ];

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
    >
      <title>{title}</title>
      <rect width={GRID} height={GRID} fill="transparent" />
      {modules.map(({ r, c }) => (
        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={color} />
      ))}
      {finders.map(({ x, y }) => (
        <g key={`f-${x}-${y}`} fill={color}>
          <path
            d={`M${x} ${y} h${FINDER} v${FINDER} h-${FINDER} z M${x + 1} ${y + 1} v${FINDER - 2} h${FINDER - 2} v-${FINDER - 2} z`}
            fillRule="evenodd"
          />
          <rect x={x + 2} y={y + 2} width={FINDER - 4} height={FINDER - 4} />
        </g>
      ))}
    </svg>
  );
}
