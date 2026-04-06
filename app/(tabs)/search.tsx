import AsyncStorage from 'expo-sqlite/kv-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { TrackListItem } from '@/components/library/TrackListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlaybackStore } from '@/store/playbackStore';
import { Track } from '@/types/music';

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 8;

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItemAsync(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveRecent(query: string, existing: string[]): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return existing;
  const updated = [trimmed, ...existing.filter((q) => q !== trimmed)].slice(0, MAX_RECENT);
  await AsyncStorage.setItemAsync(RECENT_KEY, JSON.stringify(updated));
  return updated;
}

async function removeRecent(query: string, existing: string[]): Promise<string[]> {
  const updated = existing.filter((q) => q !== query);
  await AsyncStorage.setItemAsync(RECENT_KEY, JSON.stringify(updated));
  return updated;
}

type SearchSection =
  | { title: string; type: 'track'; data: Track[] }
  | { title: string; type: 'artist' | 'album'; data: string[] };

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { tracks } = useLibraryStore();
  const { play, currentTrack } = usePlaybackStore();

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadRecent().then(setRecentSearches);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedTracks = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );

    const artistSet = new Set<string>();
    const albumSet = new Set<string>();
    const artists: string[] = [];
    const albums: string[] = [];

    for (const t of matchedTracks) {
      if (t.artist.toLowerCase().includes(q) && !artistSet.has(t.artist)) {
        artistSet.add(t.artist);
        artists.push(t.artist);
      }
      if (t.album.toLowerCase().includes(q) && !albumSet.has(t.album)) {
        albumSet.add(t.album);
        albums.push(t.album);
      }
    }

    return { tracks: matchedTracks, artists, albums };
  }, [query, tracks]);

  const sections = useMemo<SearchSection[]>(() => {
    if (!results) return [];
    const s: SearchSection[] = [];
    if (results.tracks.length) s.push({ title: 'Songs', type: 'track', data: results.tracks });
    if (results.artists.length) s.push({ title: 'Artists', type: 'artist', data: results.artists });
    if (results.albums.length) s.push({ title: 'Albums', type: 'album', data: results.albums });
    return s;
  }, [results]);

  const totalResults = results
    ? results.tracks.length + results.artists.length + results.albums.length
    : 0;

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setRecentSearches(await saveRecent(query, recentSearches));
  };

  const handleRecentTap = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = async (q: string) => {
    setRecentSearches(await removeRecent(q, recentSearches));
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>Search</Text>

        {/* Search input */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder="Artists, songs, or albums"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <IconSymbol name="xmark" size={14} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Empty query — recent searches */}
        {!query && recentSearches.length > 0 && (
          <View>
            <Text style={[styles.sectionHeader, { color: colors.muted }]}>RECENT</Text>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.recentRow} onPress={() => handleRecentTap(item)}>
                  <IconSymbol name="magnifyingglass" size={15} color={colors.muted} />
                  <Text style={[styles.recentText, { color: colors.text }]} numberOfLines={1}>
                    {item}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveRecent(item)} hitSlop={8}>
                    <IconSymbol name="xmark" size={13} color={colors.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Empty query, no recent — hint */}
        {!query && recentSearches.length === 0 && (
          <View style={styles.emptyCenter}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Search for music in your library
            </Text>
          </View>
        )}

        {/* Results */}
        {query.length > 0 && totalResults > 0 && (
          <SectionList<string | Track, SearchSection>
            sections={sections}
            keyExtractor={(item, i) =>
              typeof item === 'string' ? item + i : item.id
            }
            contentContainerStyle={styles.resultsList}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionHeader, { color: colors.muted }]}>
                {section.title.toUpperCase()}
              </Text>
            )}
            renderItem={({ item, section }) => {
              if (section.type === 'track') {
                const track = item as Track;
                return (
                  <TrackListItem
                    track={track}
                    isPlaying={currentTrack?.id === track.id}
                    onPress={async () => {
                      setRecentSearches(await saveRecent(query, recentSearches));
                      play(track, tracks);
                    }}
                  />
                );
              }
              return (
                <View style={styles.textRow}>
                  <IconSymbol name="music.note.list" size={16} color={colors.muted} />
                  <Text style={[styles.textRowLabel, { color: colors.text }]}>
                    {item as string}
                  </Text>
                </View>
              );
            }}
            ItemSeparatorComponent={({ section }: { section: SearchSection }) =>
              section.type === 'track' ? (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              ) : null
            }
          />
        )}

        {/* No results */}
        {query.length > 0 && totalResults === 0 && (
          <View style={styles.emptyCenter}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No results for "{query}"
            </Text>
          </View>
        )}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
  },
  resultsList: {
    paddingBottom: 40,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  textRowLabel: {
    fontSize: 15,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
