import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Track } from '@/types/music';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  track: Track;
  isPlaying?: boolean;
  onPress: () => void;
}

export function TrackListItem({ track, isPlaying, onPress }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Artwork */}
      <View style={styles.artworkWrap}>
        <ArtworkImage uri={track.artworkUri} size={46} borderRadius={8} />
        {isPlaying && (
          <View style={[styles.playingOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
            <IconSymbol name="waveform" size={14} color="#fff" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: isPlaying ? colors.tint : colors.text }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>

      {/* Duration */}
      <Text style={[styles.duration, { color: colors.muted }]}>
        {formatDuration(track.duration)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  artworkWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  playingOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  artist: {
    fontSize: 13,
    marginTop: 2,
  },
  duration: {
    fontSize: 13,
    flexShrink: 0,
  },
});
