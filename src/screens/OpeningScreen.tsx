import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BalancePill, Button, RarityPill } from '../components/common';
import { WATCHES, currency } from '../data/catalog';
import { errorMessage, useStore } from '../state/store';
import { BoxScene, FRAMING, useBoxRig } from '../three/BoxScene';
import { colors, radius, rarityColors } from '../theme';
import type { BoxDefinition, Watch } from '../types';

type Phase = 'inspect' | 'purchasing' | 'ready' | 'opening' | 'revealed';

const HOLD_TO_OPEN_MS = 1100;
/** Time from releasing the lid until it is high enough to reveal the watch. */
const LID_CLEAR_MS = 380;

type OpeningScreenProps = {
  box: BoxDefinition;
  onClose: () => void;
  onViewCollection: () => void;
};

export function OpeningScreen({ box, onClose, onViewCollection }: OpeningScreenProps) {
  const insets = useSafeAreaInsets();
  const { balance, purchase } = useStore();
  const rig = useBoxRig({ yaw: -0.55 });

  const [phase, setPhase] = useState<Phase>('inspect');
  const [prize, setPrize] = useState<Watch>();
  const [error, setError] = useState<string>();

  const holdProgress = useSharedValue(0);
  const reveal = useSharedValue(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(holdTimer.current);
      clearTimeout(revealTimer.current);
    },
    [],
  );

  // Once a box is bought it has to be opened: leaving is only possible before
  // buying or after the reveal. This also covers Android's back button.
  const canClose = phase === 'inspect' || phase === 'revealed';

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canClose) {
        onClose();
      }
      return true;
    });
    return () => subscription.remove();
  }, [canClose, onClose]);

  const onBuy = async () => {
    setError(undefined);
    setPhase('purchasing');
    try {
      const { item } = await purchase(box.id);
      if (!mounted.current) return;
      setPrize(WATCHES[item.watchId]);
      setPhase('ready');
    } catch (e) {
      if (!mounted.current) return;
      setError(errorMessage(e));
      setPhase('inspect');
    }
  };

  const openLid = useCallback(() => {
    rig.holding.value = 0;
    rig.faceFront.value = 1;
    rig.openTarget.value = 1;
    rig.yawVelocity.value = 0;
    setPhase('opening');
    revealTimer.current = setTimeout(() => {
      reveal.value = withSpring(1, { damping: 14, stiffness: 120 });
      setPhase('revealed');
    }, LID_CLEAR_MS);
  }, [rig, reveal]);

  const onHoldStart = () => {
    rig.holding.value = 1;
    rig.faceFront.value = 1;
    holdProgress.value = withTiming(1, { duration: HOLD_TO_OPEN_MS, easing: Easing.linear });
    holdTimer.current = setTimeout(openLid, HOLD_TO_OPEN_MS);
  };

  const onHoldEnd = () => {
    if (phase !== 'ready') return;
    clearTimeout(holdTimer.current);
    rig.holding.value = 0;
    rig.faceFront.value = 0;
    holdProgress.value = withTiming(0, { duration: 250 });
  };

  const onOpenAnother = () => {
    rig.openTarget.value = 0;
    rig.faceFront.value = 0;
    reveal.value = withTiming(0, { duration: 200 });
    holdProgress.value = 0;
    setPrize(undefined);
    setPhase('inspect');
  };

  const holdFillStyle = useAnimatedStyle(() => ({
    width: `${holdProgress.value * 100}%`,
  }));

  const canAfford = balance >= box.price;

  return (
    <Animated.View
      entering={SlideInDown.duration(380).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutDown.duration(260)}
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
          disabled={!canClose}
          onPress={onClose}
          style={[styles.closeButton, !canClose && styles.closeDisabled]}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <BalancePill />
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.kicker, { color: box.palette.accent }]}>MISTERYBOX</Text>
        <Text style={styles.title}>{box.name}</Text>
      </View>

      <View style={styles.stage}>
        <View style={[styles.stageGlow, { backgroundColor: box.palette.glow }]} />
        <BoxScene
          palette={box.palette}
          rig={rig}
          framing={FRAMING.stage}
          interactive={phase !== 'opening' && phase !== 'revealed'}
          style={StyleSheet.absoluteFill}
        />
        {prize && <WatchReveal watch={prize} progress={reveal} />}
        {phase === 'inspect' && (
          <Animated.Text entering={FadeIn.delay(400)} exiting={FadeOut} style={styles.hint}>
            Drag to inspect
          </Animated.Text>
        )}
      </View>

      <View style={styles.panel}>
        {(phase === 'inspect' || phase === 'purchasing') && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Text style={styles.sectionLabel}>Possible pulls</Text>
            <View style={styles.oddsList}>
              {box.odds.map(({ watchId, chance }) => {
                const watch = WATCHES[watchId];
                return (
                  <View key={watchId} style={styles.oddRow}>
                    <Image source={watch.image} style={styles.oddImage} resizeMode="contain" />
                    <View style={styles.oddInfo}>
                      <Text style={styles.oddName}>{watch.name}</Text>
                      <Text style={[styles.oddRarity, { color: rarityColors[watch.rarity] }]}>
                        {watch.rarity} · {currency(watch.value)}
                      </Text>
                    </View>
                    <Text style={styles.oddChance}>{chance}%</Text>
                  </View>
                );
              })}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            {!canAfford && phase === 'inspect' && (
              <Text style={styles.error}>Top up your balance to buy this box.</Text>
            )}
            <Button
              label={`Buy for ${currency(box.price)}`}
              onPress={onBuy}
              loading={phase === 'purchasing'}
              disabled={!canAfford}
              style={styles.cta}
            />
          </Animated.View>
        )}

        {phase === 'ready' && (
          <Animated.View entering={FadeInDown} exiting={FadeOut}>
            <Text style={styles.readyText}>Your box is ready. Press and hold to open it.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hold to open"
              accessibilityHint="Press and hold for about a second"
              accessibilityActions={[{ name: 'activate' }]}
              onAccessibilityAction={openLid}
              onPressIn={onHoldStart}
              onPressOut={onHoldEnd}
              style={styles.holdButton}
            >
              <Animated.View style={[styles.holdFill, { backgroundColor: box.palette.accent }, holdFillStyle]} />
              <Text style={styles.holdText}>Hold to open</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === 'revealed' && prize && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <RarityPill rarity={prize.rarity} />
            <Text style={styles.prizeName}>{prize.name}</Text>
            <Text style={styles.prizeDescription}>{prize.description}</Text>
            <Text style={styles.prizeValue}>Est. value {currency(prize.value)}</Text>
            <View style={styles.actions}>
              <Button label="Collection" variant="secondary" onPress={onViewCollection} style={styles.action} />
              <Button label="Open another" onPress={onOpenAnother} style={styles.action} />
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

function WatchReveal({ watch, progress }: { watch: Watch; progress: SharedValue<number> }) {
  const spin = useSharedValue(0);
  const color = rarityColors[watch.rarity];

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 14_000, easing: Easing.linear }), -1);
    return () => cancelAnimation(spin);
  }, [spin]);

  const watchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [70, -70]) },
      { scale: interpolate(progress.value, [0, 1], [0.25, 1]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [70, -70]) },
      { scale: interpolate(progress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.revealLayer]}>
      <Animated.View style={[styles.revealCenter, glowStyle]}>
        {/* Stacked translucent discs approximate a soft radial glow. */}
        {[300, 220, 150].map((size) => (
          <View
            key={size}
            style={[styles.glowDisc, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
          />
        ))}
        <Animated.View style={[styles.rays, raysStyle]}>
          {RAY_ANGLES.map((angle) => (
            <View key={angle} style={[styles.ray, { backgroundColor: color, transform: [{ rotate: `${angle}deg` }] }]} />
          ))}
        </Animated.View>
      </Animated.View>
      <Animated.View style={watchStyle}>
        <Image source={watch.image} style={styles.revealWatch} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const RAY_ANGLES = Array.from({ length: 12 }, (_, i) => i * 15);

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDisabled: {
    opacity: 0.35,
  },
  closeText: {
    color: colors.text,
    fontSize: 16,
  },
  titleBlock: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.1,
  },
  hint: {
    position: 'absolute',
    bottom: 8,
    color: colors.textFaint,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  panel: {
    paddingHorizontal: 16,
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  sectionLabel: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  oddsList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  oddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  oddImage: {
    width: 28,
    height: 40,
  },
  oddInfo: {
    flex: 1,
    marginLeft: 10,
  },
  oddName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  oddRarity: {
    fontSize: 12,
    marginTop: 1,
  },
  oddChance: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 10,
  },
  cta: {
    marginTop: 14,
  },
  readyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },
  holdButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdFill: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
  },
  holdText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  prizeName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  prizeDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
  },
  prizeValue: {
    color: colors.textFaint,
    fontSize: 13,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  action: {
    flex: 1,
  },
  revealLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealCenter: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowDisc: {
    position: 'absolute',
    opacity: 0.09,
  },
  rays: {
    position: 'absolute',
    width: 460,
    height: 460,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 3,
    height: 460,
    borderRadius: 2,
    opacity: 0.12,
  },
  revealWatch: {
    width: 150,
    height: 227,
  },
});
