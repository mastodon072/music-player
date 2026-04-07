import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const { setArtwork, getLyrics, setLyrics } = useLibraryStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyricsState] = useState('');
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [draftLyrics, setDraftLyrics] = useState('');
  const lyricsOpacity = useRef(new Animated.Value(0)).current;

  // Load lyrics whenever the track changes
  useEffect(() => {
    if (!currentTrack) return;
    getLyrics(currentTrack.id).then((l) => {
      setLyricsState(l);
      // Reset overlay when track changes
      setShowLyrics(false);
      lyricsOpacity.setValue(0);
    });
  }, [currentTrack, getLyrics, lyricsOpacity]);

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

  const toggleLyrics = () => {
    const toValue = showLyrics ? 0 : 1;
    setShowLyrics(!showLyrics);
    Animated.timing(lyricsOpacity, {
      toValue,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenEditor = () => {
    setDraftLyrics(lyrics);
    setEditingLyrics(true);
  };

  const handleSaveLyrics = async () => {
    await setLyrics(currentTrack.id, draftLyrics);
    setLyricsState(draftLyrics);
    setEditingLyrics(false);
  };

  const handleDiscardLyrics = () => {
    setDraftLyrics('');
    setEditingLyrics(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dismiss handle */}
      <TouchableOpacity style={styles.handle} onPress={() => router.back()}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
      </TouchableOpacity>

      {/* Artwork + lyrics overlay */}
      <TouchableOpacity
        style={styles.artworkWrap}
        onPress={toggleLyrics}
        activeOpacity={1}
      >
        <ArtworkImage uri={currentTrack.artworkUri} borderRadius={16} />

        {/* Artwork edit button — only visible when lyrics hidden */}
        {!showLyrics && (
          <TouchableOpacity
            style={[styles.artworkEditBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
            onPress={(e) => { e.stopPropagation(); handlePickArtwork(); }}
            hitSlop={8}
          >
            <IconSymbol name="waveform" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Lyrics overlay */}
        <Animated.View
          style={[
            styles.lyricsOverlay,
            { opacity: lyricsOpacity, borderRadius: 16 },
          ]}
          pointerEvents={showLyrics ? 'box-none' : 'none'}
        >
          {/* Header row */}
          <View style={styles.lyricsHeader}>
            <Text style={styles.lyricsHeaderTitle}>Lyrics</Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); handleOpenEditor(); }}
              hitSlop={8}
            >
              <IconSymbol name="plus.circle" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {lyrics.trim() ? (
            <ScrollView
              style={styles.lyricsScroll}
              contentContainerStyle={styles.lyricsContent}
              showsVerticalScrollIndicator={false}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.lyricsText}>{lyrics}</Text>
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.lyricsEmpty}
              onPress={(e) => { e.stopPropagation(); handleOpenEditor(); }}
            >
              <IconSymbol name="music.note" size={28} color="rgba(255,255,255,0.5)" />
              <Text style={styles.lyricsEmptyText}>Tap to add lyrics</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </TouchableOpacity>

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

      {/* Lyrics editor modal */}
      <Modal
        visible={editingLyrics}
        animationType="slide"
        onRequestClose={handleDiscardLyrics}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Editor header */}
            <View style={[styles.editorHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={handleDiscardLyrics} hitSlop={12}>
                <Text style={[styles.editorCancel, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.editorTitle, { color: colors.text }]} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <TouchableOpacity onPress={handleSaveLyrics} hitSlop={12}>
                <Text style={[styles.editorSave, { color: colors.tint }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.editorInput, { color: colors.text }]}
              value={draftLyrics}
              onChangeText={setDraftLyrics}
              multiline
              autoFocus
              placeholder="Paste or type lyrics here…"
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
              scrollEnabled
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  lyricsOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 16,
  },
  lyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lyricsHeaderTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingBottom: 8,
  },
  lyricsText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 26,
  },
  lyricsEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  lyricsEmptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
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
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editorTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  editorCancel: {
    fontSize: 15,
  },
  editorSave: {
    fontSize: 15,
    fontWeight: '700',
  },
  editorInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
