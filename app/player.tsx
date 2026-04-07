import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { ProgressBar } from '@/components/player/ProgressBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaybackStore } from '@/store/playbackStore';

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
    seekTo,
    shuffleEnabled,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    updateCurrentTrackArtwork,
  } = usePlaybackStore();
  const { setArtwork } = useLibraryStore();

  useEffect(() => {
    if (!currentTrack) router.back();
  }, [currentTrack]);

  if (!currentTrack) return null;

  const repeatColor = repeatMode !== 'off' ? colors.tint : colors.muted;

  const handlePickArtwork = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    await setArtwork(currentTrack.id, uri);
    updateCurrentTrackArtwork(uri);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dismiss handle */}
      <TouchableOpacity style={styles.handle} onPress={() => router.back()}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
      </TouchableOpacity>

      {/* Artwork with edit overlay */}
      <View style={styles.artworkWrap}>
        <ArtworkImage uri={currentTrack.artworkUri} borderRadius={16} />
        <TouchableOpacity
          style={[styles.artworkEditBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={handlePickArtwork}
          hitSlop={8}
        >
          <IconSymbol name="waveform" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Track info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Seekable progress bar */}
      <View style={styles.progressSection}>
        <ProgressBar position={position} duration={duration} onSeek={seekTo} />
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
  artworkWrap: {
    position: 'relative',
  },
  artworkEditBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginTop: 28,
    marginBottom: 24,
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
    marginBottom: 28,
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
