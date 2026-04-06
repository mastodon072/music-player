import { Asset } from 'expo-asset';

import { useLibraryStore } from '@/store/libraryStore';
import { Track } from '@/types/music';

const AUDIO_ASSETS = [
  { module: require('@/assets/audio/test-1.wav'), id: 'test-1', title: 'Moonlight Sonata', artist: 'Dev Orchestra', album: 'Classical Test' },
  { module: require('@/assets/audio/test-2.wav'), id: 'test-2', title: 'Summer Vibes', artist: 'Dev Band', album: 'Test Album Vol. 1' },
  { module: require('@/assets/audio/test-3.wav'), id: 'test-3', title: 'Morning Coffee', artist: 'Dev Band', album: 'Test Album Vol. 1' },
  { module: require('@/assets/audio/test-4.wav'), id: 'test-4', title: 'Rainy Day', artist: 'Chill Artist', album: 'Chill Tunes' },
  { module: require('@/assets/audio/test-5.wav'), id: 'test-5', title: 'Sunset Drive', artist: 'Chill Artist', album: 'Chill Tunes' },
];

export async function loadTestTracks(): Promise<void> {
  // Resolve all bundled assets to local file:// URIs
  const assets = await Asset.loadAsync(AUDIO_ASSETS.map((a) => a.module));

  const tracks: Track[] = AUDIO_ASSETS.map((meta, i) => ({
    id: meta.id,
    uri: assets[i].localUri ?? assets[i].uri,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    duration: 8,
    isFavourite: false,
  }));

  useLibraryStore.setState({ tracks });
}
