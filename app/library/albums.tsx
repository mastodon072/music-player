import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';

interface AlbumItem {
  name: string;
  artist: string;
  artworkUri?: string;
  trackCount: number;
}

export default function AlbumsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { tracks } = useLibraryStore();

  const albums = useMemo<AlbumItem[]>(() => {
    const map = new Map<string, AlbumItem>();
    for (const t of tracks) {
      if (!map.has(t.album)) {
        map.set(t.album, {
          name: t.album,
          artist: t.artist,
          artworkUri: t.artworkUri,
          trackCount: 1,
        });
      } else {
        map.get(t.album)!.trackCount++;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={28} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Albums</Text>
        <View style={styles.headerSpacer} />
      </View>

      {albums.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No albums found</Text>
        </View>
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/library/album/[name]', params: { name: item.name } })
              }
              activeOpacity={0.7}
            >
              <ArtworkImage uri={item.artworkUri} size={50} borderRadius={8} />
              <View style={styles.info}>
                <Text style={[styles.albumName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.albumMeta, { color: colors.muted }]} numberOfLines={1}>
                  {item.artist} · {item.trackCount} {item.trackCount === 1 ? 'song' : 'songs'}
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
  info: { flex: 1 },
  albumName: { fontSize: 15, fontWeight: '500' },
  albumMeta: { fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15 },
});
