import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Props {
  position: number;  // seconds
  duration: number;  // seconds
  onSeek: (seconds: number) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ProgressBar({ position, duration, onSeek }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const trackWidth = useRef(0);
  const [seeking, setSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const displayPosition = seeking ? seekPosition : position;
  const progress = duration > 0 ? Math.min(displayPosition / duration, 1) : 0;

  const positionFromTouch = (pageX: number, locationX: number) => {
    // Use locationX when available (initial touch), fallback to tracking via pageX
    const x = Math.max(0, Math.min(locationX ?? 0, trackWidth.current));
    return (x / trackWidth.current) * duration;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        setSeeking(true);
        const secs = positionFromTouch(e.nativeEvent.pageX, e.nativeEvent.locationX);
        setSeekPosition(secs);
      },

      onPanResponderMove: (e) => {
        const x = Math.max(0, Math.min(e.nativeEvent.locationX, trackWidth.current));
        const secs = (x / trackWidth.current) * duration;
        setSeekPosition(secs);
      },

      onPanResponderRelease: (e) => {
        const x = Math.max(0, Math.min(e.nativeEvent.locationX, trackWidth.current));
        const secs = (x / trackWidth.current) * duration;
        setSeeking(false);
        onSeek(secs);
      },

      onPanResponderTerminate: () => {
        setSeeking(false);
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.container}>
      {/* Hit area + track */}
      <View
        style={styles.hitArea}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.tint, width: `${progress * 100}%` },
            ]}
          />
          {/* Thumb */}
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.tint,
                left: `${progress * 100}%`,
                transform: [{ scale: seeking ? 1.4 : 1 }],
              },
            ]}
          />
        </View>
      </View>

      {/* Time labels */}
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: colors.muted }]}>
          {formatTime(displayPosition)}
        </Text>
        <Text style={[styles.time, { color: colors.muted }]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  hitArea: {
    paddingVertical: 12,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
    marginLeft: -(THUMB_SIZE / 2),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
  },
});
