import { SafeAreaView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlaybackStore } from '@/store/playbackStore';
import { Track } from '@/types/music';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueueScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { queue, queueIndex, currentTrack, isPlaying, jumpTo, pause, resume } =
    usePlaybackStore();

  const upNext = queue.slice(queueIndex + 1);

  const sections = [
    ...(currentTrack
      ? [{ title: 'Now Playing', data: [queue[queueIndex]], type: 'current' as const }]
      : []),
    ...(upNext.length
      ? [{ title: 'Up Next', data: upNext, type: 'upcoming' as const }]
      : []),
  ];

  if (!currentTrack) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colors.text }]}>Queue</Text>
          <View style={styles.emptyCenter}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No tracks in queue</Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>Play a song to get started</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Text style={[styles.title, { color: colors.text }]}>Queue</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.muted }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item, section }: { item: Track; section: { type: 'current' | 'upcoming' } }) => {
          const isCurrent = section.type === 'current';
          const itemIndex = queue.indexOf(item);

          return (
            <TouchableOpacity
              style={[
                styles.row,
                isCurrent && { backgroundColor: colors.card, borderRadius: 12 },
              ]}
              onPress={() => {
                if (isCurrent) {
                  isPlaying ? pause() : resume();
                } else {
                  jumpTo(itemIndex);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Artwork */}
              <View style={styles.artworkWrap}>
                <ArtworkImage uri={item.artworkUri} size={46} borderRadius={8} />
                {isCurrent && (
                  <View style={[styles.playingBadge, { backgroundColor: colors.tint }]}>
                    <IconSymbol
                      name={isPlaying ? 'pause.fill' : 'play.fill'}
                      size={10}
                      color="#fff"
                    />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.info}>
                <Text
                  style={[styles.trackTitle, { color: isCurrent ? colors.tint : colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.trackArtist, { color: colors.muted }]} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>

              {/* Duration */}
              <Text style={[styles.duration, { color: colors.muted }]}>
                {formatDuration(item.duration)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionGap: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 12,
  },
  artworkWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  playingBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  trackArtist: {
    fontSize: 13,
    marginTop: 2,
  },
  duration: {
    fontSize: 13,
    flexShrink: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySub: {
    fontSize: 14,
  },
});
