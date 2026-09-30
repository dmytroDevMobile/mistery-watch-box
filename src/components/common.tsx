import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { currency } from '../data/catalog';
import { errorMessage, useStore } from '../state/store';
import { colors, radius, rarityColors } from '../theme';
import type { Rarity } from '../types';

export function RarityPill({ rarity }: { rarity: Rarity }) {
  const color = rarityColors[rarity];
  return (
    <View style={[styles.rarityPill, { borderColor: color }]}>
      <Text style={[styles.rarityText, { color }]}>{rarity}</Text>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.onPrimary : colors.text} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.onPrimary : colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const TOP_UP_AMOUNT = 1000;

export function BalancePill() {
  const { balance, topUp } = useStore();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string>();

  const onTopUp = async () => {
    setBusy(true);
    setFailed(undefined);
    try {
      await topUp(TOP_UP_AMOUNT);
    } catch (error) {
      setFailed(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.balancePill}>
      <View>
        <Text style={styles.balanceLabel}>{failed ? 'Top-up failed' : 'Balance'}</Text>
        <Text style={styles.balanceValue}>{currency(balance)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${currency(TOP_UP_AMOUNT)} to balance`}
        hitSlop={8}
        disabled={busy}
        onPress={onTopUp}
        style={styles.topUp}
      >
        {busy ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.topUpText}>+</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rarityPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  button: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5,
  },
  balanceLabel: {
    color: colors.textFaint,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  topUp: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUpText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '500',
    marginTop: -2,
  },
});
