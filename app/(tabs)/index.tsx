import { SafeAreaView, SectionList, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const LIBRARY_SECTIONS = [
  { title: 'Songs', data: ['All Songs'] },
  { title: 'Albums', data: ['All Albums'] },
  { title: 'Artists', data: ['All Artists'] },
  { title: 'Playlists', data: ['All Playlists'] },
];

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={LIBRARY_SECTIONS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.title, { color: colors.text }]}>Library</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.muted }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowText, { color: colors.text }]}>{item}</Text>
            <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
          </View>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 16,
    paddingBottom: 16,
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
