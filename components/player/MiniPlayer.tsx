import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlaybackStore } from '@/store/playbackStore';

export function MiniPlayer() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { currentTrack, isPlaying, position, duration, pause, resume, skipNext } =
    usePlaybackStore();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push('/player')}
      activeOpacity={0.92}
    >
      {/* Artwork */}
      <ArtworkImage uri={currentTrack.artworkUri} size={40} borderRadius={8} />

      {/* Track info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Play / Pause */}
      <TouchableOpacity onPress={handlePlayPause} hitSlop={12} style={styles.button}>
        <IconSymbol
          name={isPlaying ? 'pause.fill' : 'play.fill'}
          size={26}
          color={colors.tint}
        />
      </TouchableOpacity>

      {/* Skip next */}
      <TouchableOpacity onPress={skipNext} hitSlop={12} style={styles.button}>
        <IconSymbol name="forward.fill" size={22} color={colors.icon} />
      </TouchableOpacity>

      {/* Progress line along the bottom edge */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.tint, width: `${progress * 100}%` },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    overflow: 'hidden',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    padding: 4,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressFill: {
    height: '100%',
  },
});
