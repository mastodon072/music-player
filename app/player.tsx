import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyricsState] = useState('');
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [draftLyrics, setDraftLyrics] = useState('');
  const editingTrackId = useRef<string | null>(null);
  const editingTrackTitle = useRef<string | null>(null);
  const lyricsOpacity = useRef(new Animated.Value(0)).current;

  // Use id as dependency — currentTrack object reference changes on every render
  const trackId = currentTrack?.id;

  useEffect(() => {
    if (!trackId) return;
    getLyrics(trackId).then((l) => {
      setLyricsState(l);
      setShowLyrics(false);
      lyricsOpacity.setValue(0);
    });
  }, [trackId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const next = !showLyrics;
    setShowLyrics(next);
    Animated.timing(lyricsOpacity, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenEditor = () => {
    editingTrackId.current = currentTrack.id;
    editingTrackTitle.current = currentTrack.title;
    setDraftLyrics(lyrics);
    setEditingLyrics(true);
  };

  const handleSaveLyrics = async () => {
    const id = editingTrackId.current ?? currentTrack.id;
    await setLyrics(id, draftLyrics);
    // Only update displayed lyrics if still on the same track
    if (id === currentTrack.id) setLyricsState(draftLyrics);
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

      {/* Artwork */}
      <View style={styles.artworkWrap}>
        <ArtworkImage uri={currentTrack.artworkUri} borderRadius={16} />

        {/* Artwork edit button — only visible when lyrics hidden */}
        {!showLyrics && (
          <TouchableOpacity
            style={[styles.artworkEditBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
            onPress={handlePickArtwork}
            hitSlop={8}
          >
            <IconSymbol name="waveform" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Lyrics overlay — plain View so ScrollView works */}
        {showLyrics && (
          <Animated.View
            style={[styles.lyricsOverlay, { opacity: lyricsOpacity, borderRadius: 16 }]}
          >
            {/* Header */}
            <View style={styles.lyricsHeader}>
              <Text style={styles.lyricsHeaderTitle}>Lyrics</Text>
              <TouchableOpacity onPress={handleOpenEditor} hitSlop={8}>
                <IconSymbol name="plus.circle" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {lyrics.trim() ? (
              <ScrollView
                style={styles.lyricsScroll}
                contentContainerStyle={styles.lyricsContent}
                showsVerticalScrollIndicator={false}
                bounces
              >
                <Text style={styles.lyricsText}>{lyrics}</Text>
              </ScrollView>
            ) : (
              <TouchableOpacity style={styles.lyricsEmpty} onPress={handleOpenEditor}>
                <IconSymbol name="music.note" size={28} color="rgba(255,255,255,0.5)" />
                <Text style={styles.lyricsEmptyText}>Tap to add lyrics</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>

      {/* Track info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={[styles.artist, { color: colors.muted }]} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
        {/* Lyrics toggle pill */}
        <TouchableOpacity
          style={[
            styles.lyricsPill,
            { backgroundColor: showLyrics ? colors.tint : colors.card, borderColor: colors.border },
          ]}
          onPress={toggleLyrics}
          hitSlop={8}
        >
          <IconSymbol name="music.note.list" size={13} color={showLyrics ? '#fff' : colors.muted} />
          <Text style={[styles.lyricsPillText, { color: showLyrics ? '#fff' : colors.muted }]}>
            Lyrics
          </Text>
        </TouchableOpacity>
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
          <View style={[styles.editorHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={handleDiscardLyrics} hitSlop={12}>
              <Text style={[styles.editorCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.editorTitle, { color: colors.text }]} numberOfLines={1}>
              {editingTrackTitle.current ?? currentTrack.title}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 16,
    borderRadius: 16,
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
  lyricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  lyricsPillText: {
    fontSize: 13,
    fontWeight: '600',
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
