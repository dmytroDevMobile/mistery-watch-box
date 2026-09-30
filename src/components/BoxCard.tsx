import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { WATCHES, currency } from '../data/catalog';
import { BoxScene, FRAMING, useBoxRig } from '../three/BoxScene';
import { colors, radius, rarityColors } from '../theme';
import type { BoxDefinition } from '../types';

type BoxCardProps = {
  box: BoxDefinition;
  onPress: () => void;
};

export function BoxCard({ box, onPress }: BoxCardProps) {
  const rig = useBoxRig({ yaw: -0.5, autoSpin: 0.35 });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${box.name} box, ${currency(box.price)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.stage}>
        <View style={[styles.glow, { backgroundColor: box.palette.glow }]} />
        <BoxScene palette={box.palette} rig={rig} framing={FRAMING.card} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{box.name}</Text>
          <View style={[styles.pricePill, { borderColor: box.palette.accent }]}>
            <Text style={styles.price}>{currency(box.price)}</Text>
          </View>
        </View>
        <Text style={styles.tagline}>{box.tagline}</Text>

        <View style={styles.oddsRow}>
          {box.odds.map(({ watchId, chance }) => {
            const watch = WATCHES[watchId];
            return (
              <View key={watchId} style={styles.odd}>
                <Image source={watch.image} style={styles.oddImage} resizeMode="contain" />
                <Text style={[styles.oddChance, { color: rarityColors[watch.rarity] }]}>{chance}%</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  stage: {
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    opacity: 0.12,
  },
  info: {
    padding: 18,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  pricePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  price: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  odd: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingVertical: 8,
  },
  oddImage: {
    width: 36,
    height: 52,
  },
  oddChance: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
