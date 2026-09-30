import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

/** Minimum time on screen so the splash never just flickers. */
const MIN_VISIBLE_MS = 900;

type SplashProps = {
  /** True once the app has content to show; the splash then animates away. */
  ready: boolean;
  onFinished: () => void;
};

/**
 * Picks up exactly where LaunchScreen.storyboard leaves off (same image, size
 * and centre), breathes while loading, then lifts away to reveal the app.
 */
export function Splash({ ready, onFinished }: SplashProps) {
  const pulse = useSharedValue(1);
  const exit = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setTimeout(() => {
      exit.value = withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onFinished)();
        }
      });
    }, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [ready, exit, onFinished]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -40 * exit.value }, { scale: pulse.value * (1 + 0.12 * exit.value) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.container, containerStyle]}>
      <Animated.Image
        source={require('../../assets/brand/splash-logo.png')}
        style={[styles.logo, logoStyle]}
        accessibilityLabel="MisteryBox"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 300,
  },
});
