import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { QwipoLogo } from '../components/BrandMark';

/* Color-morph splash — lavender bg + white brand mark scales in, then bg fades
   to white while the mark cross-fades to the colored primary. Auto-advances at
   2.7s; tap to skip. Mirrors qwipo-buyer-paytm-app's splash. */
const TOTAL_MS = 2700;

export function SplashScreen({ onContinue }: { onContinue: () => void }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: TOTAL_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
    const timer = setTimeout(onContinue, TOTAL_MS);
    return () => clearTimeout(timer);
  }, [onContinue, t]);

  const background = t.interpolate({ inputRange: [0, 0.5, 0.76, 1], outputRange: ['#bc77ff', '#bc77ff', '#ffffff', '#ffffff'] });
  const whiteOpacity = t.interpolate({ inputRange: [0, 0.18, 0.53, 0.73], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
  const primaryOpacity = t.interpolate({ inputRange: [0.53, 0.73], outputRange: [0, 1], extrapolate: 'clamp' });
  const scale = t.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1.25, 1, 1], extrapolate: 'clamp' });

  const W = 150;
  const H = (W * 985.52) / 735.55; // logo aspect

  return (
    <Pressable onPress={onContinue} className="flex-1">
      <Animated.View style={{ flex: 1, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
        {/* fixed-size box centered by the parent; both marks fill it (overlay) */}
        <Animated.View style={{ width: W, height: H }}>
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, opacity: whiteOpacity, transform: [{ scale }] }}>
            <QwipoLogo width={W} variant="white" />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, opacity: primaryOpacity }}>
            <QwipoLogo width={W} variant="primary" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
