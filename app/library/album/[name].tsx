import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { TrackListItem } from '@/components/library/TrackListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaybackStore } from '@/store/playbackStore';

function formatDuration(seconds: number) {
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function AlbumDetailScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { name } = useLocalSearchParams<{ name: string }>();
  const { tracks } = useLibraryStore();
  const { play, currentTrack } = usePlaybackStore();

  const albumTracks = useMemo(
    () => tracks.filter((t) => t.album === name),
    [tracks, name],
  );

  const totalDuration = useMemo(
    () => albumTracks.reduce((sum, t) => sum + t.duration, 0),
    [albumTracks],
  );

  const artwork = albumTracks.find((t) => t.artworkUri)?.artworkUri;
  const artist = albumTracks[0]?.artist ?? '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={albumTracks}
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
              <ArtworkImage uri={artwork} size={160} borderRadius={16} />
              <Text style={[styles.albumTitle, { color: colors.text }]} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[styles.albumArtist, { color: colors.tint }]}>{artist}</Text>
              <Text style={[styles.albumMeta, { color: colors.muted }]}>
                {albumTracks.length} {albumTracks.length === 1 ? 'song' : 'songs'} · {formatDuration(totalDuration)}
              </Text>
            </View>

            {/* Play all */}
            {albumTracks.length > 0 && (
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: colors.tint }]}
                onPress={() => play(albumTracks[0], albumTracks)}
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
            onPress={() => play(item, albumTracks)}
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
  albumTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  albumArtist: { fontSize: 15, fontWeight: '600' },
  albumMeta: { fontSize: 13 },
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
