import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';

const LIBRARY_SECTIONS = [
  { title: 'Songs', data: [{ label: 'All Songs', route: '/library/songs' as const }] },
  { title: 'Albums', data: [{ label: 'All Albums', route: null }] },
  { title: 'Artists', data: [{ label: 'All Artists', route: null }] },
  { title: 'Playlists', data: [{ label: 'All Playlists', route: null }] },
];

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { tracks, loadFromDb, scanLibrary } = useLibraryStore();

  useEffect(() => {
    loadFromDb().then(() => {
      if (useLibraryStore.getState().tracks.length === 0) {
        scanLibrary();
      }
    });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={LIBRARY_SECTIONS}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>Library</Text>
            <Text style={[styles.trackCount, { color: colors.muted }]}>
              {tracks.length > 0 ? `${tracks.length} songs` : ''}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.muted }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => item.route && router.push(item.route)}
            activeOpacity={item.route ? 0.7 : 1}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  trackCount: {
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
  },
});
