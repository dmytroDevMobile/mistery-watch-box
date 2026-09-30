import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BalancePill, Button } from './src/components/common';
import { Splash } from './src/components/Splash';
import { findBox } from './src/data/catalog';
import { CatalogueScreen } from './src/screens/CatalogueScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { OpeningScreen } from './src/screens/OpeningScreen';
import { StoreProvider, useStore } from './src/state/store';
import { colors } from './src/theme';

type Tab = 'boxes' | 'collection';

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar barStyle="light-content" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { status } = useStore();
  const [splashVisible, setSplashVisible] = useState(true);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  return (
    <View style={styles.screen}>
      {status === 'ready' && <Main />}
      {status === 'error' && <LoadError />}
      {status === 'loading' && !splashVisible && (
        <View style={[styles.screen, styles.centered]}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      )}
      {splashVisible && (
        <Splash ready={status !== 'loading'} onFinished={hideSplash} />
      )}
    </View>
  );
}

function LoadError() {
  const { error, reload } = useStore();
  return (
    <View style={[styles.screen, styles.centered]}>
      <Text style={styles.errorTitle}>Couldn't load the vault</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Button label="Try again" onPress={reload} style={styles.retry} />
    </View>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const { collection } = useStore();
  const [tab, setTab] = useState<Tab>('boxes');
  const [openingBoxId, setOpeningBoxId] = useState<string>();
  const openingBox = openingBoxId ? findBox(openingBoxId) : undefined;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.brand}>MISTERYBOX</Text>
        <BalancePill />
      </View>

      <View style={styles.body}>
        {tab === 'boxes' ? (
          <CatalogueScreen onSelectBox={setOpeningBoxId} />
        ) : (
          <CollectionScreen onBrowse={() => setTab('boxes')} />
        )}
      </View>

      <View
        style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        accessibilityRole="tablist"
      >
        <TabButton
          label="Boxes"
          active={tab === 'boxes'}
          onPress={() => setTab('boxes')}
        />
        <TabButton
          label={`Collection · ${collection.length}`}
          active={tab === 'collection'}
          onPress={() => setTab('collection')}
        />
      </View>

      {openingBox && (
        <OpeningScreen
          box={openingBox}
          onClose={() => setOpeningBoxId(undefined)}
          onViewCollection={() => {
            setOpeningBoxId(undefined);
            setTab('collection');
          }}
        />
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  retry: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brand: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 5,
  },
  body: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceRaised,
  },
  tabText: {
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text,
  },
});
