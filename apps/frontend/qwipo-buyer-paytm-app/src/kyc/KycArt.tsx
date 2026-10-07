import { useId } from 'react';
import { cn } from '@mockups/ui';
import { idKindOf, type IdScene, type IdType, type SceneHighlight, type ShopScene } from './kycData';

/* Drawn "photos" for the KYC guide — a Kirana shop front in every way a
   buyer might photograph it, an owner ID, and a pin on a street map.

   Drawn rather than stock photos so every example shows exactly one mistake
   (blurry / dark / blocked / …) on the same shop, which makes the comparison
   obvious. Every fill is a token, so dark mode just works. */

/* ---- Shop front -------------------------------------------------------- */

export function ShopPhotoArt({
  scene,
  highlight = 'none',
  className,
}: {
  scene: ShopScene;
  highlight?: SceneHighlight;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const viewBox =
    scene === 'board-closeup' ? '36 26 88 22' : scene === 'too-far' ? '-160 -100 480 360' : '0 0 160 120';

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block aspect-[4/3] w-full bg-info-subtle', className)}
      aria-hidden
    >
      <defs>
        <filter id={`blur-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={scene === 'person' ? 1.6 : 2.4} />
        </filter>
      </defs>

      {scene === 'too-far' && <Street />}

      {scene === 'unrelated' ? (
        <Park />
      ) : (
        <g filter={scene === 'blurry' || scene === 'person' ? `url(#blur-${uid})` : undefined}>
          <Sky sun={highlight === 'light'} bare={scene === 'too-far'} />
          <Shop />
        </g>
      )}

      {scene === 'dark' && (
        <>
          <rect x="0" y="0" width="160" height="120" className="fill-overlay" />
          <rect x="0" y="0" width="160" height="120" className="fill-overlay" />
        </>
      )}
      {scene === 'blocked' && <Vehicles />}
      {scene === 'board-hidden' && <TreeOverBoard />}
      {scene === 'person' && <Person />}

      {highlight === 'board' && <Ring x={21} y={25} w={118} h={23} />}
      {highlight === 'entrance' && <Ring x={49} y={54} w={62} h={46} />}
      {highlight === 'whole' && <Ring x={11} y={13} w={138} h={88} />}
    </svg>
  );
}

function Ring({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="4"
      className="fill-none stroke-success"
      strokeWidth="2.2"
      strokeDasharray="5 3"
    />
  );
}

function Sky({ sun, bare }: { sun?: boolean; bare?: boolean }) {
  // `bare`: the wide street view has already drawn the sky and road.
  if (bare) return null;
  return (
    <>
      <rect x="-400" y="-300" width="1000" height="700" className="fill-info-subtle" />
      <circle cx="146" cy="12" r={sun ? 8 : 6} className="fill-warning" />
      {sun &&
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1={146 + Math.cos((a * Math.PI) / 180) * 11}
            y1={12 + Math.sin((a * Math.PI) / 180) * 11}
            x2={146 + Math.cos((a * Math.PI) / 180) * 15}
            y2={12 + Math.sin((a * Math.PI) / 180) * 15}
            className="stroke-warning"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      <rect x="-400" y="98" width="1000" height="200" className="fill-muted" />
      <rect x="-400" y="96" width="1000" height="3" className="fill-border-strong" />
    </>
  );
}

const GOODS = ['fill-success', 'fill-warning', 'fill-primary', 'fill-accent', 'fill-info', 'fill-error'];

function Shop() {
  return (
    <g>
      {/* building + parapet */}
      <rect x="18" y="22" width="124" height="76" className="fill-card stroke-border-strong" strokeWidth="1" />
      <rect x="14" y="18" width="132" height="6" rx="1" className="fill-border-strong" />
      {/* name board */}
      <rect x="24" y="28" width="112" height="17" rx="2" className="fill-primary" />
      <text
        x="80"
        y="39.8"
        textAnchor="middle"
        className="fill-primary-foreground"
        style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6 }}
      >
        SRI SAI KIRANA
      </text>
      {/* awning */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d={`M${24 + i * 14} 47 h14 l-2 8 h-10 z`}
          className={i % 2 ? 'fill-warning-subtle' : 'fill-warning'}
        />
      ))}
      {/* shutters */}
      {[24, 110].map((x) => (
        <g key={x}>
          <rect x={x} y="57" width="26" height="41" className="fill-muted" />
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={x} x2={x + 26} y1={61 + i * 4} y2={61 + i * 4} className="stroke-border-strong" strokeWidth="0.6" />
          ))}
        </g>
      ))}
      {/* open entrance with shelves */}
      <rect x="52" y="57" width="56" height="41" className="fill-background-sunken" />
      {[68, 80].map((y) => (
        <rect key={y} x="54" y={y} width="52" height="1.5" className="fill-border-strong" />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={`a${i}`} x={56 + i * 6.3} y="60" width="4.5" height="8" rx="0.8" className={GOODS[i % GOODS.length]} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={`b${i}`} x={57 + i * 7} y="72.5" width="5" height="7.5" rx="0.8" className={GOODS[(i + 2) % GOODS.length]} />
      ))}
      {/* counter */}
      <rect x="58" y="86" width="44" height="12" rx="1" className="fill-border-strong" />
      <rect x="58" y="86" width="44" height="2" className="fill-foreground-tertiary" />
    </g>
  );
}

/* ---- Shop inside ------------------------------------------------------- */

/** The same shop from the doorway — three stocked racks on the back wall and
    the counter in front. Only the photo's quality varies (blurry / dark); an
    inside photo has no board to frame, so `highlight` rings the racks. */
export function ShopInsideArt({
  scene = 'good',
  highlight,
  className,
}: {
  scene?: 'good' | 'blurry' | 'dark';
  highlight?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 160 120"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block aspect-[4/3] w-full bg-card', className)}
      aria-hidden
    >
      <defs>
        <filter id={`inblur-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <g filter={scene === 'blurry' ? `url(#inblur-${uid})` : undefined}>
        <rect x="0" y="0" width="160" height="120" className="fill-card" />
        <rect x="0" y="96" width="160" height="24" className="fill-muted" />
        {/* tube light */}
        <rect x="50" y="4" width="60" height="3" rx="1.5" className="fill-warning-subtle stroke-border-strong" strokeWidth="0.5" />
        {/* racks — four shelves of stock each */}
        {[6, 58, 110].map((x, r) => (
          <g key={x}>
            <rect x={x} y="14" width="44" height="82" className="fill-background-sunken stroke-border-strong" strokeWidth="1" />
            {[34, 54, 74, 94].map((y, s) => (
              <g key={y}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const h = 9 + ((i + s + r) % 3) * 2;
                  return (
                    <rect
                      key={i}
                      x={x + 3 + i * 6.8}
                      y={y - h}
                      width="5"
                      height={h}
                      rx="0.8"
                      className={GOODS[(i + s * 2 + r) % GOODS.length]}
                    />
                  );
                })}
                <rect x={x} y={y} width="44" height="2" className="fill-border-strong" />
              </g>
            ))}
          </g>
        ))}
        {/* counter + billing machine */}
        <rect x="30" y="82" width="100" height="18" rx="1" className="fill-border-strong" />
        <rect x="30" y="82" width="100" height="2.5" className="fill-foreground-tertiary" />
        <rect x="98" y="74" width="16" height="8" rx="1" className="fill-primary" />
        <rect x="101" y="76" width="10" height="3" rx="0.5" className="fill-primary-foreground" />
      </g>

      {scene === 'dark' && (
        <>
          <rect x="0" y="0" width="160" height="120" className="fill-overlay" />
          <rect x="0" y="0" width="160" height="120" className="fill-overlay" />
        </>
      )}
      {highlight && <Ring x={3} y={11} w={154} h={88} />}
    </svg>
  );
}

/** Neighbouring buildings — only seen when the photo is taken from too far. */
function Street() {
  const blocks = [
    { x: -150, w: 70, h: 110 },
    { x: -72, w: 80, h: 70 },
    { x: 150, w: 60, h: 90 },
    { x: 218, w: 90, h: 130 },
  ];
  return (
    <g>
      <rect x="-400" y="-300" width="1000" height="700" className="fill-info-subtle" />
      {blocks.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={98 - b.h} width={b.w} height={b.h} className="fill-border stroke-border-strong" strokeWidth="1.5" />
          {Array.from({ length: Math.floor(b.h / 30) }).map((_, r) =>
            [0, 1].map((c) => (
              <rect key={`${r}${c}`} x={b.x + 10 + c * (b.w / 2)} y={98 - b.h + 10 + r * 30} width={b.w / 2 - 20} height="14" className="fill-card" />
            ))
          )}
        </g>
      ))}
      <rect x="-400" y="98" width="1000" height="200" className="fill-muted" />
      {[-140, -60, 20, 100, 180, 260].map((x) => (
        <rect key={x} x={x} y="170" width="40" height="5" className="fill-card" />
      ))}
    </g>
  );
}

function Park() {
  return (
    <g>
      <rect x="0" y="0" width="160" height="120" className="fill-info-subtle" />
      <rect x="0" y="80" width="160" height="40" className="fill-success-subtle" />
      <path d="M0 110 C 50 96, 110 96, 160 104 L160 120 L0 120 Z" className="fill-muted" />
      {[
        { x: 28, r: 18 },
        { x: 70, r: 14 },
        { x: 124, r: 20 },
      ].map((t) => (
        <g key={t.x}>
          <rect x={t.x - 2.5} y={86 - t.r} width="5" height={t.r + 8} className="fill-border-strong" />
          <circle cx={t.x} cy={80 - t.r} r={t.r} className="fill-success" />
        </g>
      ))}
      {/* bench */}
      <rect x="86" y="86" width="22" height="3" className="fill-foreground-tertiary" />
      <rect x="88" y="89" width="2" height="6" className="fill-foreground-tertiary" />
      <rect x="104" y="89" width="2" height="6" className="fill-foreground-tertiary" />
    </g>
  );
}

function Vehicles() {
  return (
    <g>
      {/* tempo */}
      <rect x="2" y="54" width="62" height="38" rx="3" className="fill-info" />
      <path d="M64 64 h16 l8 12 v16 h-24 z" className="fill-info" />
      <rect x="68" y="67" width="12" height="9" className="fill-info-subtle" />
      {/* auto rickshaw */}
      <path d="M88 96 v-22 c0-10 8-16 22-16 h14 c10 0 16 6 16 16 v22 z" className="fill-warning" />
      <rect x="90" y="56" width="50" height="6" rx="3" className="fill-foreground-secondary" />
      <rect x="112" y="66" width="18" height="12" className="fill-warning-subtle" />
      {/* stacked sacks */}
      <rect x="136" y="70" width="22" height="12" rx="4" className="fill-border-strong" />
      <rect x="138" y="80" width="20" height="14" rx="4" className="fill-foreground-tertiary" />
      {/* wheels */}
      {[16, 52, 96, 128].map((x) => (
        <circle key={x} cx={x} cy="96" r="6" className="fill-foreground-secondary stroke-card" strokeWidth="1.5" />
      ))}
    </g>
  );
}

function TreeOverBoard() {
  return (
    <g>
      <rect x="6" y="40" width="6" height="58" className="fill-border-strong" />
      {[
        { cx: 30, cy: 30, r: 20 },
        { cx: 58, cy: 34, r: 18 },
        { cx: 86, cy: 30, r: 19 },
        { cx: 112, cy: 36, r: 17 },
        { cx: 134, cy: 30, r: 16 },
        { cx: 12, cy: 38, r: 14 },
      ].map((c) => (
        <circle key={c.cx} cx={c.cx} cy={c.cy} r={c.r} className="fill-success" />
      ))}
    </g>
  );
}

function Person() {
  return (
    <g>
      <path d="M36 120 c0-30 18-44 44-44 s44 14 44 44 z" className="fill-accent" />
      <rect x="74" y="64" width="12" height="14" className="fill-warning-subtle" />
      <circle cx="80" cy="48" r="20" className="fill-warning-subtle stroke-border-strong" strokeWidth="1" />
      <path d="M60 46 c0-16 10-22 20-22 s20 6 20 22 c-6-8-12-10-20-10 s-14 2-20 10z" className="fill-foreground-secondary" />
      <circle cx="73" cy="50" r="1.8" className="fill-foreground" />
      <circle cx="87" cy="50" r="1.8" className="fill-foreground" />
      <path d="M74 58 q6 4 12 0" className="fill-none stroke-foreground" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

/* ---- Owner ID ---------------------------------------------------------- */

const DOC_TITLE: Partial<Record<IdType, string>> = {
  shopReg: 'SHOP REGISTRATION',
  udyam: 'UDYAM REGISTRATION',
  fssai: 'FSSAI LICENSE',
};

/** Owner ID or shop document — an ID card, a certificate page or an invoice. */
export function IdCardArt({
  scene = 'clear',
  type = 'aadhaar',
  title,
  className,
}: {
  scene?: IdScene;
  type?: IdType | null;
  /** Certificate heading, where the document isn't one of the KYC types
   *  (a GST certificate drawn as a certificate). Keep it to ~17 letters. */
  title?: string;
  className?: string;
}) {
  const kind = idKindOf(type);
  if (kind !== 'card') return <DocArt scene={scene} kind={kind} title={title ?? DOC_TITLE[type ?? 'shopReg'] ?? 'CERTIFICATE'} className={className} />;
  return <CardArt scene={scene} className={className} />;
}

function DocArt({
  scene,
  kind,
  title,
  className,
}: {
  scene: IdScene;
  kind: 'certificate' | 'invoice';
  title: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className={cn('block aspect-[16/10] w-full', className)} aria-hidden>
      <defs>
        <filter id={`docblur-${uid}`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect x="0" y="0" width="160" height="100" className="fill-background-sunken" />
      <g
        transform={scene === 'cut' ? 'translate(50 34) rotate(-8)' : undefined}
        filter={scene === 'blurry' ? `url(#docblur-${uid})` : undefined}
      >
        <rect x="42" y="5" width="76" height="90" rx="2" className="fill-card stroke-border-strong" strokeWidth="1" />
        {kind === 'certificate' ? (
          <>
            <rect x="46" y="9" width="68" height="82" rx="1" className="fill-none stroke-primary" strokeWidth="0.8" />
            <circle cx="80" cy="20" r="6" className="fill-primary-soft stroke-primary" strokeWidth="0.8" />
            <text x="80" y="35" textAnchor="middle" className="fill-primary" style={{ fontSize: 5.2, fontWeight: 800, letterSpacing: 0.4 }}>
              {title}
            </text>
            <text x="80" y="47" textAnchor="middle" className="fill-foreground" style={{ fontSize: 6.2, fontWeight: 800 }}>
              SRI SAI KIRANA
            </text>
            {[54, 59, 64].map((y) => (
              <rect key={y} x="54" y={y} width="52" height="2" rx="1" className="fill-border-strong" />
            ))}
            <text x="54" y="74" className="fill-foreground-secondary" style={{ fontSize: 4.2, fontWeight: 600 }}>
              Owner: RAJESH KUMAR
            </text>
            <circle cx="100" cy="82" r="6" className="fill-none stroke-error" strokeWidth="1" />
            <rect x="54" y="82" width="26" height="1.5" className="fill-border-strong" />
          </>
        ) : (
          <>
            <text x="48" y="15" className="fill-foreground" style={{ fontSize: 5.5, fontWeight: 800 }}>
              TAX INVOICE
            </text>
            <text x="112" y="15" textAnchor="end" className="fill-foreground-secondary" style={{ fontSize: 3.8 }}>
              28 Sep 2026
            </text>
            <rect x="46" y="19" width="68" height="12" rx="1" className="fill-primary-soft" />
            <text x="48" y="24" className="fill-foreground-secondary" style={{ fontSize: 3.6 }}>
              Billed to
            </text>
            <text x="48" y="29.5" className="fill-foreground" style={{ fontSize: 5.4, fontWeight: 800 }}>
              SRI SAI KIRANA
            </text>
            {[37, 44, 51, 58, 65].map((y) => (
              <g key={y}>
                <rect x="48" y={y} width="34" height="2" rx="1" className="fill-border-strong" />
                <rect x="98" y={y} width="14" height="2" rx="1" className="fill-border-strong" />
              </g>
            ))}
            <rect x="46" y="72" width="68" height="0.8" className="fill-border-strong" />
            <text x="48" y="80" className="fill-foreground" style={{ fontSize: 4.8, fontWeight: 800 }}>
              Total
            </text>
            <text x="112" y="80" textAnchor="end" className="fill-foreground" style={{ fontSize: 4.8, fontWeight: 800 }}>
              ₹18,450
            </text>
          </>
        )}
      </g>
    </svg>
  );
}

function CardArt({ scene, className }: { scene: IdScene; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className={cn('block aspect-[16/10] w-full', className)} aria-hidden>
      <defs>
        <filter id={`idblur-${uid}`}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect x="0" y="0" width="160" height="100" className="fill-background-sunken" />
      <g
        transform={scene === 'cut' ? 'translate(58 30) rotate(-8)' : undefined}
        filter={scene === 'blurry' ? `url(#idblur-${uid})` : undefined}
      >
        <rect x="14" y="12" width="132" height="76" rx="6" className="fill-card stroke-border-strong" strokeWidth="1" />
        <path d="M14 18 a6 6 0 0 1 6-6 h120 a6 6 0 0 1 6 6 v8 h-132 z" className="fill-primary-soft" />
        <text x="80" y="22" textAnchor="middle" className="fill-primary" style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: 0.8 }}>
          GOVERNMENT OF INDIA
        </text>
        <rect x="22" y="33" width="28" height="36" rx="2" className="fill-muted" />
        <circle cx="36" cy="46" r="7" className="fill-border-strong" />
        <path d="M24 69 c0-10 6-14 12-14 s12 4 12 14 z" className="fill-border-strong" />
        <text x="58" y="41" className="fill-foreground" style={{ fontSize: 7, fontWeight: 700 }}>
          RAJESH KUMAR
        </text>
        <rect x="58" y="46" width="60" height="3" rx="1.5" className="fill-border-strong" />
        <rect x="58" y="53" width="44" height="3" rx="1.5" className="fill-border-strong" />
        <text x="58" y="68" className="fill-foreground" style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1 }}>
          XXXX XXXX 4821
        </text>
        <rect x="22" y="76" width="116" height="3" rx="1.5" className="fill-border" />
      </g>
    </svg>
  );
}

/* ---- Pin on a street map ------------------------------------------------ */

type PinVariant = 'on-shop' | 'away' | 'captured';

export function PinMapArt({ variant, className }: { variant: PinVariant; className?: string }) {
  const shop = { x: 84, y: 58 };
  const pin = variant === 'away' ? { x: 160, y: 96 } : shop;
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={cn('block w-full', className)} aria-hidden>
      <rect x="0" y="0" width="200" height="120" className="fill-background-subtle" />
      {/* blocks */}
      {[
        [8, 8, 52, 30],
        [8, 50, 52, 30],
        [8, 92, 52, 26],
        [72, 8, 56, 30],
        [140, 8, 52, 30],
        [140, 50, 52, 30],
        [72, 92, 56, 26],
        [140, 92, 52, 26],
      ].map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="3" className="fill-border" />
      ))}
      <rect x="130" y="82" width="70" height="8" className="fill-info-subtle" />
      {/* roads */}
      <g className="stroke-card" strokeWidth="7" strokeLinecap="round">
        <line x1="0" y1="44" x2="200" y2="44" />
        <line x1="0" y1="86" x2="200" y2="86" />
        <line x1="66" y1="0" x2="66" y2="120" />
        <line x1="134" y1="0" x2="134" y2="120" />
      </g>
      {/* the shop */}
      <g transform={`translate(${shop.x - 14} ${shop.y - 12})`}>
        <rect x="0" y="4" width="28" height="22" rx="2" className="fill-card stroke-border-strong" strokeWidth="1" />
        <rect x="2" y="6" width="24" height="6" rx="1" className="fill-primary" />
        <rect x="9" y="15" width="10" height="11" className="fill-background-sunken" />
      </g>
      {variant === 'away' && (
        <>
          <line
            x1={shop.x}
            y1={shop.y}
            x2={pin.x}
            y2={pin.y - 4}
            className="stroke-error"
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <rect x="102" y="64" width="46" height="13" rx="6.5" className="fill-error" />
          <text x="125" y="73" textAnchor="middle" className="fill-card" style={{ fontSize: 7, fontWeight: 700 }}>
            500 m away
          </text>
        </>
      )}
      {variant === 'captured' && <circle cx={pin.x} cy={pin.y} r="18" className="fill-primary" opacity="0.15" />}
      <g transform={`translate(${pin.x - 12} ${pin.y - 26})`}>
        <path
          d="M12 26s-10-8-10-15.5a10 10 0 0 1 20 0C22 18 12 26 12 26z"
          className={variant === 'away' ? 'fill-error' : variant === 'on-shop' ? 'fill-success' : 'fill-primary'}
        />
        <circle cx="12" cy="10.5" r="3.6" className="fill-card" />
      </g>
    </svg>
  );
}
