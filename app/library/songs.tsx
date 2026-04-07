import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TrackListItem } from '@/components/library/TrackListItem';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLibraryStore } from '@/store/libraryStore';
import { loadTestTracks } from '@/store/testData';
import { usePlaybackStore } from '@/store/playbackStore';
import { Track } from '@/types/music';

export default function AllSongsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { tracks, isScanning, loadFromDb, scanLibrary, importTracks } = useLibraryStore();
  const { play, currentTrack } = usePlaybackStore();
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // Already loaded in memory — no need to hit the DB again
    if (useLibraryStore.getState().tracks.length > 0) return;
    loadFromDb().then(() => {
      if (useLibraryStore.getState().tracks.length === 0) {
        scanLibrary();
      }
    });
  }, []);

  const handlePlay = (track: Track) => {
    play(track, tracks);
  };

  const handleLoadTestData = async () => {
    setIsLoadingTest(true);
    await loadTestTracks();
    setIsLoadingTest(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const { imported, skipped } = await importTracks();
      if (imported > 0) {
        Alert.alert(
          'Import Complete',
          `${imported} ${imported === 1 ? 'song' : 'songs'} imported${skipped > 0 ? `, ${skipped} already in library` : ''}.`,
        );
      } else if (skipped > 0) {
        Alert.alert('Already Imported', 'All selected songs are already in your library.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const isEmpty = tracks.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <IconSymbol name="chevron.left" size={28} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>All Songs</Text>
        <View style={styles.headerActions}>
          {/* Import from Files */}
          <TouchableOpacity onPress={handleImport} hitSlop={12} disabled={isImporting}>
            {isImporting
              ? <ActivityIndicator size="small" color={colors.tint} />
              : <IconSymbol name="folder.fill" size={20} color={colors.tint} />
            }
          </TouchableOpacity>
          {/* Scan device library */}
          <TouchableOpacity onPress={scanLibrary} hitSlop={12} disabled={isScanning}>
            <IconSymbol name="plus" size={22} color={isScanning ? colors.muted : colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {isScanning && isEmpty ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.tint} />
          <Text style={[styles.scanText, { color: colors.muted }]}>Scanning library…</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No songs found</Text>
          <Text style={[styles.emptySubText, { color: colors.muted }]}>
            Tap the folder icon to import files, or + to scan your device
          </Text>
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: colors.tint }]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <IconSymbol name="folder.fill" size={16} color="#fff" />
                  <Text style={styles.importButtonText}>Import from Files</Text>
                </>
            }
          </TouchableOpacity>
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.testButton, { borderColor: colors.tint }]}
              onPress={handleLoadTestData}
              disabled={isLoadingTest}
            >
              {isLoadingTest
                ? <ActivityIndicator size="small" color={colors.tint} />
                : <Text style={[styles.testButtonText, { color: colors.tint }]}>Load test data</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <TrackListItem
              track={item}
              isPlaying={currentTrack?.id === item.id}
              onPress={() => handlePlay(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 180,
    justifyContent: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  testButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 140,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
