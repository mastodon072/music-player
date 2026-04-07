import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TrackListItem } from '@/components/library/TrackListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaybackStore } from '@/store/playbackStore';

export default function ArtistDetailScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { name } = useLocalSearchParams<{ name: string }>();
  const { tracks } = useLibraryStore();
  const { play, currentTrack } = usePlaybackStore();

  const artistTracks = useMemo(
    () => tracks.filter((t) => t.artist === name),
    [tracks, name],
  );

  const albumCount = useMemo(
    () => new Set(artistTracks.map((t) => t.album)).size,
    [artistTracks],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={artistTracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListHeaderComponent={
          <>
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
              <IconSymbol name="chevron.left" size={28} color={colors.tint} />
            </TouchableOpacity>

            {/* Hero */}
            <View style={styles.hero}>
              <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                <IconSymbol name="person.2.fill" size={56} color={colors.muted} />
              </View>
              <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[styles.artistMeta, { color: colors.muted }]}>
                {albumCount} {albumCount === 1 ? 'album' : 'albums'} · {artistTracks.length} {artistTracks.length === 1 ? 'song' : 'songs'}
              </Text>
            </View>

            {/* Play all */}
            {artistTracks.length > 0 && (
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: colors.tint }]}
                onPress={() => play(artistTracks[0], artistTracks)}
                activeOpacity={0.85}
              >
                <IconSymbol name="play.fill" size={16} color="#fff" />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TrackListItem
            track={item}
            isPlaying={currentTrack?.id === item.id}
            onPress={() => play(item, artistTracks)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, alignSelf: 'flex-start' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  artistMeta: { fontSize: 13 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 28,
  },
  playAllText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 180 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
});
