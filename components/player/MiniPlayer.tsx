import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlaybackStore } from '@/store/playbackStore';

export function MiniPlayer() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { currentTrack, isPlaying, pause, resume, skipNext } = usePlaybackStore();

  if (!currentTrack) return null;

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
      {/* Artwork placeholder */}
      <View style={[styles.artwork, { backgroundColor: colors.border }]} />

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
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
});
