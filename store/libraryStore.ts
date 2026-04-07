import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { createAudioPlayer } from 'expo-audio';
import AsyncStorage from 'expo-sqlite/kv-store';
import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

import { Playlist, Track } from '@/types/music';

/** Load a file URI briefly to read its duration, then clean up. */
async function getAudioDuration(uri: string): Promise<number> {
  return new Promise((resolve) => {
    const player = createAudioPlayer({ uri });
    const timeout = setTimeout(() => {
      sub.remove();
      player.remove();
      resolve(0);
    }, 8000);

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.duration > 0) {
        clearTimeout(timeout);
        sub.remove();
        player.remove();
        resolve(status.duration);
      }
    });
  });
}

const IMPORTS_DIR = FileSystem.documentDirectory + 'imported_audio/';

const DB_NAME = 'music.db';
const PLAYLISTS_KEY = 'playlists';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (_db) return _db;
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
      isFavourite INTEGER NOT NULL DEFAULT 0,
      lyrics TEXT
    );
  `);
  // Safe migration for existing databases
  try {
    await db.execAsync(`ALTER TABLE tracks ADD COLUMN lyrics TEXT`);
  } catch {
    // Column already exists — ignore
  }
  _db = db;
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

async function persistPlaylists(playlists: Playlist[]) {
  await AsyncStorage.setItemAsync(PLAYLISTS_KEY, JSON.stringify(playlists));
}

interface LibraryStore {
  tracks: Track[];
  isScanning: boolean;
  permissionStatus: MediaLibrary.PermissionStatus | null;
  playlists: Playlist[];

  requestPermission: () => Promise<boolean>;
  scanLibrary: () => Promise<void>;
  loadFromDb: () => Promise<void>;
  toggleFavourite: (trackId: string) => Promise<void>;

  importTracks: () => Promise<{ imported: number; skipped: number }>;
  setArtwork: (trackId: string, artworkUri: string) => Promise<void>;
  getLyrics: (trackId: string) => Promise<string>;
  setLyrics: (trackId: string, lyrics: string) => Promise<void>;

  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  isScanning: false,
  permissionStatus: null,
  playlists: [],

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

  importTracks: async () => {
    // Pick audio files
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return { imported: 0, skipped: 0 };
    }

    // Ensure imports directory exists
    const dirInfo = await FileSystem.getInfoAsync(IMPORTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMPORTS_DIR, { intermediates: true });
    }

    const db = await getDb();
    const existing = get().tracks;
    const existingNames = new Set(existing.map((t) => t.title));

    let imported = 0;
    let skipped = 0;
    const newTracks: Track[] = [];

    for (const asset of result.assets) {
      const filename = asset.name;
      const titleFromFilename = filename.replace(/\.[^/.]+$/, '');

      // Skip if already imported (by title match)
      if (existingNames.has(titleFromFilename)) {
        skipped++;
        continue;
      }

      const destUri = IMPORTS_DIR + filename;

      // Copy file into app's document directory for persistent access
      try {
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      } catch {
        // File may already exist — use the existing copy
      }

      const duration = await getAudioDuration(destUri);

      const track: Track = {
        id: 'import_' + Date.now() + '_' + imported,
        uri: destUri,
        title: titleFromFilename,
        artist: 'Unknown Artist',
        album: 'Imported',
        duration,
        artworkUri: undefined,
        isFavourite: false,
      };

      await db.runAsync(
        `INSERT OR IGNORE INTO tracks (id, uri, title, artist, album, duration, artworkUri, isFavourite)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        track.id, track.uri, track.title, track.artist, track.album,
        track.duration, track.artworkUri ?? null,
      );

      newTracks.push(track);
      imported++;
    }

    if (newTracks.length > 0) {
      set((s) => ({ tracks: [...s.tracks, ...newTracks] }));
    }

    return { imported, skipped };
  },

  setArtwork: async (trackId, artworkUri) => {
    const db = await getDb();
    await db.runAsync('UPDATE tracks SET artworkUri = ? WHERE id = ?', artworkUri, trackId);
    set((s) => ({
      tracks: s.tracks.map((t) =>
        t.id === trackId ? { ...t, artworkUri } : t,
      ),
    }));
  },

  getLyrics: async (trackId) => {
    // Check in-memory first — always up to date after setLyrics
    const inMemory = get().tracks.find((t) => t.id === trackId);
    if (inMemory && inMemory.lyrics !== undefined && inMemory.lyrics !== null) {
      return inMemory.lyrics;
    }
    // Fall back to SQLite (e.g. first load before tracks are in memory)
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<{ lyrics: string | null }>(
        'SELECT lyrics FROM tracks WHERE id = ?',
        trackId,
      );
      return row?.lyrics ?? '';
    } catch {
      return '';
    }
  },

  setLyrics: async (trackId, lyrics) => {
    const db = await getDb();
    await db.runAsync('UPDATE tracks SET lyrics = ? WHERE id = ?', lyrics, trackId);
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, lyrics } : t)),
    }));
  },

  loadPlaylists: async () => {
    try {
      const raw = await AsyncStorage.getItemAsync(PLAYLISTS_KEY);
      const playlists: Playlist[] = raw ? JSON.parse(raw) : [];
      set({ playlists });
    } catch {
      set({ playlists: [] });
    }
  },

  createPlaylist: async (name) => {
    const playlist: Playlist = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: Date.now(),
      trackIds: [],
    };
    const playlists = [...get().playlists, playlist];
    await persistPlaylists(playlists);
    set({ playlists });
    return playlist;
  },

  deletePlaylist: async (id) => {
    const playlists = get().playlists.filter((p) => p.id !== id);
    await persistPlaylists(playlists);
    set({ playlists });
  },

  addTrackToPlaylist: async (playlistId, trackId) => {
    const playlists = get().playlists.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p,
    );
    await persistPlaylists(playlists);
    set({ playlists });
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const playlists = get().playlists.map((p) =>
      p.id === playlistId
        ? { ...p, trackIds: p.trackIds.filter((tid) => tid !== trackId) }
        : p,
    );
    await persistPlaylists(playlists);
    set({ playlists });
  },
}));
