import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BoxCard } from '../components/BoxCard';
import { useStore } from '../state/store';
import { colors } from '../theme';

type CatalogueScreenProps = {
  onSelectBox: (boxId: string) => void;
};

export function CatalogueScreen({ onSelectBox }: CatalogueScreenProps) {
  const { boxes } = useStore();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityLabel="Box catalogue"
    >
      <Text style={styles.heading}>Choose a box</Text>
      <Text style={styles.subheading}>Every box holds one watch. Tap a box to inspect it and see the odds.</Text>
      <View style={styles.list}>
        {boxes.map((box) => (
          <BoxCard key={box.id} box={box} onPress={() => onSelectBox(box.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  subheading: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  list: {
    gap: 16,
    marginTop: 20,
  },
});
