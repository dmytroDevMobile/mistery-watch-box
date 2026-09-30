import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Button, RarityPill } from '../components/common';
import { WATCHES, currency, findBox } from '../data/catalog';
import { useStore } from '../state/store';
import { colors, radius } from '../theme';
import type { OwnedWatch } from '../types';

type CollectionScreenProps = {
  onBrowse: () => void;
};

const relativeTime = (timestamp: number) => {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function CollectionScreen({ onBrowse }: CollectionScreenProps) {
  const { collection } = useStore();

  const totalValue = useMemo(
    () => collection.reduce((sum, item) => sum + (WATCHES[item.watchId]?.value ?? 0), 0),
    [collection],
  );

  return (
    <FlatList
      data={collection}
      keyExtractor={(item) => item.uid}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Collection"
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.heading}>Collection</Text>
          <View style={styles.stats}>
            <Stat label="Watches" value={String(collection.length)} />
            <Stat label="Est. value" value={currency(totalValue)} />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No watches yet</Text>
          <Text style={styles.emptyText}>Open your first box to start the collection.</Text>
          <Button label="Browse boxes" onPress={onBrowse} style={styles.emptyButton} />
        </View>
      }
      renderItem={({ item }) => <OwnedWatchCard item={item} />}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function OwnedWatchCard({ item }: { item: OwnedWatch }) {
  const watch = WATCHES[item.watchId];
  if (!watch) {
    return null;
  }
  const box = findBox(item.boxId);

  return (
    <View style={styles.card} accessible accessibilityLabel={`${watch.name}, ${watch.rarity}`}>
      <Image source={watch.image} style={styles.image} resizeMode="contain" />
      <RarityPill rarity={watch.rarity} />
      <Text style={styles.name} numberOfLines={1}>
        {watch.name}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {box ? `${box.name} · ` : ''}
        {relativeTime(item.acquiredAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statLabel: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: '50%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  image: {
    width: '100%',
    height: 150,
    marginBottom: 10,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  meta: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
});
