import { Image, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { QWIPO_VIEWBOX, QWIPO_CIRCLE, QWIPO_Q, QWIPO_WORDMARK } from './brandPaths';
import { LOGO_VIEWBOX, LOGO_CIRCLE, LOGO_PATHS } from './logoPaths';

/* Horizontal "qwipo" logo (Q disc + wordmark) — for headers. */
export function QwipoWordmark({ height = 22 }: { height?: number }) {
  const width = (height * 836.63) / 247.73;
  return (
    <Svg width={width} height={height} viewBox={LOGO_VIEWBOX}>
      {LOGO_CIRCLE && <Circle cx={LOGO_CIRCLE.cx} cy={LOGO_CIRCLE.cy} r={LOGO_CIRCLE.r} fill={LOGO_CIRCLE.fill} />}
      {LOGO_PATHS.map((p, i) => (
        <Path key={i} d={p.d} fill={p.fill} />
      ))}
    </Svg>
  );
}

/* Qwipo brand mark (disc + Q + "Qwipo" wordmark) — the real logo geometry from
   qwipo-app-v2's qwipo-primary.svg, rendered inline via react-native-svg.
   - primary: purple disc, white Q, dark wordmark (on light surfaces)
   - white:   white disc, purple Q + wordmark (on the lavender splash bg) */
export function QwipoLogo({ width = 100, variant = 'primary' }: { width?: number; variant?: 'primary' | 'white' }) {
  const height = (width * 985.52) / 735.55;
  const disc = variant === 'white' ? '#ffffff' : '#bc77ff';
  const q = variant === 'white' ? '#bc77ff' : '#ffffff';
  const word = variant === 'white' ? '#bc77ff' : '#231f20';
  return (
    <Svg width={width} height={height} viewBox={QWIPO_VIEWBOX}>
      <Circle cx={QWIPO_CIRCLE.cx} cy={QWIPO_CIRCLE.cy} r={QWIPO_CIRCLE.r} fill={disc} />
      <Path d={QWIPO_Q} fill={q} />
      {QWIPO_WORDMARK.map((d, i) => (
        <Path key={i} d={d} fill={word} />
      ))}
    </Svg>
  );
}

/* "POWERED BY ONDC DigiDukaan" lockup — the real logo (raster extracted from
   digidukaan-logo.svg). White padding around the art is invisible on the white
   auth background. */
export function PoweredBy({ width = 300 }: { width?: number }) {
  // Source PNG is 1809×238 (≈7.6:1).
  return (
    <Image
      source={require('../../assets/brand/digidukaan.png')}
      style={{ width, height: width / 7.6 }}
      resizeMode="contain"
    />
  );
}

/* Full auth lockup: mark + powered-by, matching qwipo-app-v2's AuthBrand. */
export function AuthBrand() {
  return (
    <View className="items-center gap-2">
      <QwipoLogo width={100} />
      <PoweredBy width={300} />
    </View>
  );
}
