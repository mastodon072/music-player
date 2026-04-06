import * as MediaLibrary from 'expo-media-library';
import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

import { Track } from '@/types/music';

const DB_NAME = 'music.db';

async function getDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      duration REAL NOT NULL,
      artworkUri TEXT,
      isFavourite INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

function assetToTrack(asset: MediaLibrary.Asset): Track {
  return {
    id: asset.id,
    uri: asset.uri,
    title: asset.filename.replace(/\.[^/.]+$/, ''),
    artist: asset.artist ?? 'Unknown Artist',
    album: asset.albumId ?? 'Unknown Album',
    duration: asset.duration,
    artworkUri: undefined,
    isFavourite: false,
  };
}

interface LibraryStore {
  tracks: Track[];
  isScanning: boolean;
  permissionStatus: MediaLibrary.PermissionStatus | null;

  requestPermission: () => Promise<boolean>;
  scanLibrary: () => Promise<void>;
  loadFromDb: () => Promise<void>;
  toggleFavourite: (trackId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  isScanning: false,
  permissionStatus: null,

  requestPermission: async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    set({ permissionStatus: status });
    return status === MediaLibrary.PermissionStatus.GRANTED;
  },

  scanLibrary: async () => {
    const granted = await get().requestPermission();
    if (!granted) return;

    set({ isScanning: true });

    try {
      const db = await getDb();
      const tracks: Track[] = [];
      let after: string | undefined;

      // Paginate through all audio assets
      while (true) {
        const page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 200,
          after,
        });

        for (const asset of page.assets) {
          tracks.push(assetToTrack(asset));
        }

        if (!page.hasNextPage) break;
        after = page.endCursor;
      }

      // Upsert all tracks into SQLite
      await db.withTransactionAsync(async () => {
        for (const track of tracks) {
          await db.runAsync(
            `INSERT OR REPLACE INTO tracks (id, uri, title, artist, album, duration, artworkUri, isFavourite)
             VALUES (?, ?, ?, ?, ?, ?, ?,
               COALESCE((SELECT isFavourite FROM tracks WHERE id = ?), 0)
             )`,
            track.id, track.uri, track.title, track.artist, track.album,
            track.duration, track.artworkUri ?? null, track.id,
          );
        }
      });

      set({ tracks, isScanning: false });
    } catch (e) {
      set({ isScanning: false });
      throw e;
    }
  },

  loadFromDb: async () => {
    try {
      const db = await getDb();
      const rows = await db.getAllAsync<Track>('SELECT * FROM tracks ORDER BY title ASC');
      set({ tracks: rows.map((r) => ({ ...r, isFavourite: Boolean(r.isFavourite) })) });
    } catch {
      // DB not yet populated — ignore
    }
  },

  toggleFavourite: async (trackId) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE tracks SET isFavourite = NOT isFavourite WHERE id = ?',
      trackId,
    );
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, isFavourite: !t.isFavourite } : t,
      ),
    }));
  },
}));
