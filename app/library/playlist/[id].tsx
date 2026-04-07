import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ArtworkImage } from '@/components/player/ArtworkImage';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaybackStore } from '@/store/playbackStore';
import { Track } from '@/types/music';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistDetailScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tracks, playlists, loadPlaylists, addTrackToPlaylist, removeTrackFromPlaylist } =
    useLibraryStore();
  const { play, currentTrack } = usePlaybackStore();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    if (playlists.length === 0) loadPlaylists();
  }, []);

  const playlist = playlists.find((p) => p.id === id);

  const playlistTracks = useMemo<Track[]>(() => {
    if (!playlist) return [];
    return playlist.trackIds
      .map((tid) => tracks.find((t) => t.id === tid))
      .filter((t): t is Track => t !== undefined);
  }, [playlist, tracks]);

  const pickerTracks = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return tracks.filter(
      (t) =>
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)),
    );
  }, [tracks, pickerQuery]);

  if (!playlist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Playlist not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={playlistTracks}
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
              <View style={[styles.playlistArt, { backgroundColor: colors.card }]}>
                <IconSymbol name="music.note.list" size={52} color={colors.tint} />
              </View>
              <Text style={[styles.playlistName, { color: colors.text }]} numberOfLines={2}>
                {playlist.name}
              </Text>
              <Text style={[styles.playlistMeta, { color: colors.muted }]}>
                {playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {playlistTracks.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.tint }]}
                  onPress={() => play(playlistTracks[0], playlistTracks)}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="play.fill" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Play All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.tint }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.85}
              >
                <IconSymbol name="plus" size={16} color={colors.tint} />
                <Text style={[styles.actionBtnText, { color: colors.tint }]}>Add Songs</Text>
              </TouchableOpacity>
            </View>

            {playlistTracks.length === 0 && (
              <View style={styles.emptyInner}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Tap "Add Songs" to get started
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.trackRow}>
            <TouchableOpacity
              style={styles.trackTouchable}
              onPress={() => play(item, playlistTracks)}
              activeOpacity={0.7}
            >
              <ArtworkImage uri={item.artworkUri} size={46} borderRadius={8} />
              <View style={styles.trackInfo}>
                <Text
                  style={[styles.trackTitle, { color: currentTrack?.id === item.id ? colors.tint : colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.trackArtist, { color: colors.muted }]} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Text style={[styles.trackDuration, { color: colors.muted }]}>
                {formatDuration(item.duration)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeTrackFromPlaylist(playlist.id, item.id)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <IconSymbol name="trash" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Add songs picker modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Add Songs</Text>
            <TouchableOpacity onPress={() => { setShowPicker(false); setPickerQuery(''); }} hitSlop={12}>
              <IconSymbol name="xmark" size={22} color={colors.tint} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search songs"
              placeholderTextColor={colors.muted}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={pickerTracks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.pickerList}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
            renderItem={({ item }) => {
              const inPlaylist = playlist.trackIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    if (inPlaylist) {
                      removeTrackFromPlaylist(playlist.id, item.id);
                    } else {
                      addTrackToPlaylist(playlist.id, item.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <ArtworkImage uri={item.artworkUri} size={44} borderRadius={6} />
                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.trackArtist, { color: colors.muted }]} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                  <IconSymbol
                    name={inPlaylist ? 'checkmark.circle.fill' : 'circle'}
                    size={22}
                    color={inPlaylist ? colors.tint : colors.muted}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
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
  playlistArt: {
    width: 140,
    height: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistName: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  playlistMeta: { fontSize: 13 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 28,
  },
  actionBtnOutline: { borderWidth: 1.5, backgroundColor: 'transparent' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 180 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: '500' },
  trackArtist: { fontSize: 13, marginTop: 2 },
  trackDuration: { fontSize: 13, flexShrink: 0 },
  removeBtn: { padding: 8 },
  emptyInner: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  pickerList: { paddingHorizontal: 16, paddingBottom: 40 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
});
