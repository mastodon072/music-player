import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlaybackStore } from '@/store/playbackStore';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    pause,
    resume,
    skipNext,
    skipPrev,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
  } = usePlaybackStore();

  useEffect(() => {
    if (!currentTrack) router.back();
  }, [currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const repeatColor = repeatMode !== 'off' ? colors.tint : colors.muted;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dismiss handle */}
      <TouchableOpacity style={styles.handle} onPress={() => router.back()}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
      </TouchableOpacity>

      {/* Artwork */}
      <View style={[styles.artwork, { backgroundColor: colors.card, borderColor: colors.border }]} />

      {/* Track info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.tint, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.muted }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: colors.muted }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle} hitSlop={12}>
          <IconSymbol
            name="shuffle"
            size={22}
            color={shuffleEnabled ? colors.tint : colors.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={skipPrev} hitSlop={12}>
          <IconSymbol name="backward.fill" size={32} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.tint }]}
          onPress={() => (isPlaying ? pause() : resume())}
        >
          <IconSymbol
            name={isPlaying ? 'pause.fill' : 'play.fill'}
            size={30}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={skipNext} hitSlop={12}>
          <IconSymbol name="forward.fill" size={32} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={cycleRepeat} hitSlop={12}>
          <IconSymbol name="repeat" size={22} color={repeatColor} />
          {repeatMode === 'one' && (
            <View style={[styles.repeatOneDot, { backgroundColor: repeatColor }]} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  info: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  artist: {
    fontSize: 16,
  },
  progressSection: {
    marginBottom: 36,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 2,
  },
});
