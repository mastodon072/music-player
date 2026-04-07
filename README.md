# Music Player

A React Native / Expo music player app for iOS. Scans your device's audio library, plays tracks with full playback controls, and lets you browse by album, artist, and playlist.

## Features

- Library scanning from device media library
- Full-screen player with seekable progress bar, shuffle, and repeat
- Mini player overlay on all screens
- Browse by Albums, Artists, and Playlists
- Playlist creation and management
- Search across songs, artists, and albums
- Queue management with Now Playing + Up Next
- SQLite persistence for the track library
- Dark/light theme support

---

## Development Setup

### Prerequisites

- Node.js 18+
- Xcode (for iOS builds)
- CocoaPods (`sudo gem install cocoapods`)

### Install dependencies

```bash
npm install
npx pod-install
```

### Run on iOS Simulator

```bash
npx expo run:ios
```

---

## Running on a Real iPhone (Development Build)

This app uses native modules (audio, media library) so **Expo Go will not work**. You must install a development build directly on the device.

### One-time setup

**1. Add your Apple ID to Xcode**
- Open Xcode → Settings (`⌘,`) → Accounts
- Click **+** → Apple ID → sign in

**2. Create a development certificate**
- In Accounts, select your Apple ID
- Click **Manage Certificates...**
- Click **+** → **Apple Development**

**3. Set the signing team**
- Open the workspace:
  ```bash
  open ios/musicplayer.xcworkspace
  ```
- Select the **musicplayer** target in the sidebar
- Go to **Signing & Capabilities**
- Set **Team** to your Apple ID
- Ensure **Automatically manage signing** is checked
- Click **Register Device** if prompted

**4. Enable Developer Mode on your iPhone**
- Go to **Settings → Privacy & Security → Developer Mode**
- Toggle it on and restart when prompted

### Build and install

Connect your iPhone via USB, then:

```bash
npx expo run:ios --device
```

Select your device from the list. The app will build and install automatically.

> **Note:** With a free Apple ID, the app certificate expires after **7 days**. Just re-run the command above to reinstall.

If you see **"Untrusted Developer"** on the iPhone:
- Go to **Settings → General → VPN & Device Management**
- Tap your Apple ID → **Trust**

### Standalone (no Mac required after install)

To build a release version that bundles all JS and runs without a Metro server:

```bash
npx expo run:ios --device --configuration Release
```

---

## Production Build (Apple Developer Account required)

A paid Apple Developer account ($99/year) is required for TestFlight and App Store distribution.

```bash
# Build for TestFlight
npx eas build --platform ios --profile production

# Submit to App Store / TestFlight
npx eas submit --platform ios
```

---

## Project Structure

```
app/
  (tabs)/         # Tab screens: Library, Search, Queue
  library/        # Browse screens: Songs, Albums, Artists, Playlists
  player.tsx      # Full-screen player modal
  _layout.tsx     # Root layout with MiniPlayer overlay

components/
  player/         # MiniPlayer, ArtworkImage, ProgressBar
  library/        # TrackListItem
  ui/             # IconSymbol

store/
  playbackStore.ts  # Zustand: audio playback state
  libraryStore.ts   # Zustand: track library + playlists

services/
  AudioService.ts   # expo-audio singleton

types/
  music.ts          # Track, Album, Artist, Playlist types

assets/
  audio/            # Bundled test WAV files (dev only)
```

---

## Test Data (Simulator / Dev)

Since the iOS simulator has no media library, use the built-in test data:

1. Open the app → Library → All Songs
2. Tap **Load test data** (visible in development builds only)

This loads 5 bundled WAV tracks so you can test playback without a real device.
