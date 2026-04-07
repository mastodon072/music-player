import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';

interface ArtistItem {
  name: string;
  trackCount: number;
  albumCount: number;
}

export default function ArtistsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { tracks } = useLibraryStore();

  const artists = useMemo<ArtistItem[]>(() => {
    const map = new Map<string, { trackCount: number; albums: Set<string> }>();
    for (const t of tracks) {
      if (!map.has(t.artist)) {
        map.set(t.artist, { trackCount: 1, albums: new Set([t.album]) });
      } else {
        const entry = map.get(t.artist)!;
        entry.trackCount++;
        entry.albums.add(t.album);
      }
    }
    return Array.from(map.entries())
      .map(([name, { trackCount, albums }]) => ({
        name,
        trackCount,
        albumCount: albums.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={28} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Artists</Text>
        <View style={styles.headerSpacer} />
      </View>

      {artists.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No artists found</Text>
        </View>
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/library/artist/[name]', params: { name: item.name } })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                <IconSymbol name="person.2.fill" size={22} color={colors.muted} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.artistMeta, { color: colors.muted }]} numberOfLines={1}>
                  {item.albumCount} {item.albumCount === 1 ? 'album' : 'albums'} · {item.trackCount} {item.trackCount === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  headerSpacer: { width: 28 },
  list: { paddingHorizontal: 16, paddingBottom: 180 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  artistName: { fontSize: 15, fontWeight: '500' },
  artistMeta: { fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15 },
});
