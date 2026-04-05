# Music Player — Architecture

## Overview

A cross-platform mobile music player built with **Expo / React Native**, targeting iOS and Android. The app reads music from the device library, provides a browsable library, full playback controls, queue management, and a persistent mini-player.

---

## Navigation Structure

```
app/
├── _layout.tsx              # Root: font loading, theme provider, StatusBar
├── +not-found.tsx           # 404 fallback
├── player.tsx               # Full-screen Now Playing (modal, presented over tabs)
├── (tabs)/
│   ├── _layout.tsx          # Bottom tab navigator
│   ├── index.tsx            # Library tab  (Songs / Albums / Artists / Playlists)
│   ├── search.tsx           # Search tab
│   └── queue.tsx            # Queue tab (current playback queue)
├── album/
│   └── [id].tsx             # Album detail screen
├── artist/
│   └── [id].tsx             # Artist detail screen
└── playlist/
    └── [id].tsx             # Playlist detail screen
```

### Tab Bar

| Tab | Route | Icon | Purpose |
|-----|-------|------|---------|
| Library | `/` | `music.note.list` | Browse all music |
| Search | `/search` | `magnifyingglass` | Full-text search |
| Queue | `/queue` | `list.bullet` | Current playback queue |

A **MiniPlayer** component sits persistently above the tab bar. Tapping it navigates to `/player` (full-screen modal).

---

## Screen Breakdown

### Library (`app/(tabs)/index.tsx`)
- Top-level categories: Songs, Albums, Artists, Playlists
- Each category navigates to a dedicated list screen
- Pull-to-refresh triggers a library rescan

### Album / Artist / Playlist Detail
- Header: artwork, title, metadata
- Track list with tap-to-play
- Shuffle / Play All buttons

### Search (`app/(tabs)/search.tsx`)
- Text input searches tracks, albums, and artists simultaneously
- Results grouped by type
- Recent searches persisted with `expo-sqlite/kv-store`

### Queue (`app/(tabs)/queue.tsx`)
- Shows upcoming tracks in playback order
- Drag-to-reorder via `react-native-gesture-handler`
- History section (previously played tracks)

### Player (`app/player.tsx`)
- Full-screen modal with album artwork
- Animated progress bar (seek support)
- Play / Pause / Skip Back / Skip Forward
- Shuffle and Repeat toggles
- Like / Favourite action
- Swipe down to dismiss

---

## State Management

### Playback Store (Zustand)

```ts
interface PlaybackStore {
  // Current track
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;       // seconds
  duration: number;       // seconds

  // Queue
  queue: Track[];
  queueIndex: number;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';

  // Actions
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  seekTo: (position: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
}
```

### Library Store (Zustand)

```ts
interface LibraryStore {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  isScanning: boolean;

  scanLibrary: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  addTrackToPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  toggleFavourite: (trackId: string) => void;
}
```

---

## Audio Engine

### Library: `expo-av`

```ts
import { Audio } from 'expo-av';
```

**Key configuration:**

```ts
Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
});
```

### Singleton Audio Service (`services/AudioService.ts`)

Wraps `expo-av` with a clean API used by the Zustand playback store:

- `load(uri)` — loads a track into the Sound instance
- `play()` / `pause()` / `stop()`
- `seekTo(position)` — seek to seconds
- `setOnPlaybackUpdate(cb)` — callback for position/duration updates
- `setOnFinish(cb)` — callback when track ends (triggers auto-advance)

### Lock Screen / Now Playing Info

Use `expo-media-library` metadata + the React Native background audio mode to populate the lock screen controls natively on iOS and Android.

---

## Data Layer

### Device Library Scanning

```ts
import * as MediaLibrary from 'expo-media-library';
```

- Request `MEDIA_LIBRARY` permission on first launch
- `MediaLibrary.getAssetsAsync({ mediaType: 'audio' })` — fetch all audio files
- Paginate with `after` cursor for large libraries
- Map `MediaLibrary.Asset` → internal `Track` type

### Local Database: `expo-sqlite`

Tables:

| Table | Columns |
|-------|---------|
| `tracks` | id, uri, title, artist, album, duration, artworkUri, isFavourite |
| `albums` | id, title, artist, artworkUri, year |
| `artists` | id, name, artworkUri |
| `playlists` | id, name, createdAt |
| `playlist_tracks` | playlistId, trackId, position |

**Pattern**: scan device library → diff against DB → upsert new tracks, remove stale entries.

### Key-Value Store

Use `expo-sqlite/kv-store` for:
- Recent searches
- Last playback position (resume on launch)
- User preferences (shuffle, repeat defaults)

---

## Component Architecture

```
components/
├── ui/                        # Primitives (existing)
│   ├── IconSymbol.tsx
│   ├── IconSymbol.ios.tsx
│   ├── TabBarBackground.tsx
│   └── TabBarBackground.ios.tsx
├── ThemedText.tsx             # (existing)
├── ThemedView.tsx             # (existing)
├── HapticTab.tsx              # (existing)
│
├── player/
│   ├── MiniPlayer.tsx         # Persistent mini-player above tab bar
│   ├── PlaybackControls.tsx   # Play/Pause/Skip/Seek controls
│   ├── ProgressBar.tsx        # Animated seek bar
│   └── ArtworkImage.tsx       # Album art with fallback
│
├── library/
│   ├── TrackListItem.tsx      # Single track row (art, title, artist, duration)
│   ├── AlbumCard.tsx          # Grid card for album view
│   └── ArtistCard.tsx         # Artist row / card
│
└── common/
    ├── SectionHeader.tsx      # Styled section list header
    └── EmptyState.tsx         # Empty state with icon + message
```

---

## Key Dependencies

| Package | Purpose | Install |
|---------|---------|---------|
| `expo-av` | Audio playback | `npx expo install expo-av` |
| `expo-media-library` | Device music scanning | `npx expo install expo-media-library` |
| `expo-sqlite` | Local database + KV store | `npx expo install expo-sqlite` |
| `zustand` | Lightweight state management | `npm install zustand` |
| `react-native-gesture-handler` | Drag-to-reorder, swipe | already installed |
| `react-native-reanimated` | Smooth animations | already installed |

---

## Permissions

| Permission | Platform | Reason |
|-----------|---------|--------|
| `MEDIA_LIBRARY` | iOS + Android | Read device audio files |
| `MEDIA_LIBRARY_WRITE_DOCUMENTS` | Android | (optional) playlist export |

Request permissions with `expo-media-library` on first Library screen mount:

```ts
const { status } = await MediaLibrary.requestPermissionsAsync();
```

---

## Implementation Roadmap

1. **Phase 1 — Audio Engine**
   - Integrate `expo-av`, create `AudioService`
   - Playback store with basic play/pause/skip
   - MiniPlayer component wired to store

2. **Phase 2 — Library**
   - Install `expo-media-library`, `expo-sqlite`
   - Permission flow and library scanning
   - Populate SQLite DB; display tracks in Library tab

3. **Phase 3 — Player UI**
   - Full-screen player modal
   - Animated progress bar with seek
   - Artwork display, shuffle/repeat controls

4. **Phase 4 — Browse**
   - Albums, Artists, Playlists list screens
   - Detail screens with cover art header

5. **Phase 5 — Search**
   - SQLite FTS (full-text search) on tracks/albums/artists
   - Recent searches via KV store

6. **Phase 6 — Queue & Polish**
   - Drag-to-reorder queue
   - Lock screen metadata
   - Favourites, playlist management
