import { create } from 'zustand';

import { audioService } from '@/services/AudioService';
import { Track } from '@/types/music';

interface PlaybackStore {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'one' | 'all';

  play: (track: Track, queue?: Track[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrev: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  jumpTo: (index: number) => Promise<void>;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;

  updateCurrentTrackArtwork: (artworkUri: string) => void;

  // Internal callbacks — not for external use
  _setPosition: (position: number, duration: number) => void;
  _handleFinish: () => Promise<void>;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  // Configure audio session immediately so background playback is ready
  audioService.init();

  audioService.setOnPlaybackUpdate((position, duration) => {
    get()._setPosition(position, duration);
  });
  audioService.setOnFinish(() => {
    get()._handleFinish();
  });

  return {
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
    queueIndex: 0,
    shuffleEnabled: false,
    repeatMode: 'off',

    play: async (track, queue) => {
      const { currentTrack } = get();

      // Same track already loaded — just ensure it's playing from the start
      if (currentTrack?.id === track.id) {
        await audioService.seekTo(0);
        audioService.play();
        set({ isPlaying: true, position: 0 });
        return;
      }

      const tracks = queue ?? [track];
      const index = tracks.findIndex((t) => t.id === track.id);
      await audioService.configure();
      await audioService.load(track.uri);
      audioService.play();
      set({
        currentTrack: track,
        isPlaying: true,
        queue: tracks,
        queueIndex: index >= 0 ? index : 0,
        position: 0,
        duration: 0,
      });
    },

    pause: async () => {
      audioService.pause();
      set({ isPlaying: false });
    },

    resume: async () => {
      const { position, duration } = get();
      if (duration > 0 && position >= duration - 0.1) {
        await audioService.seekTo(0);
        set({ position: 0 });
      }
      audioService.play();
      set({ isPlaying: true });
    },

    skipNext: async () => {
      const { queue, queueIndex, repeatMode, shuffleEnabled } = get();
      if (queue.length === 0) return;

      let nextIndex: number;
      if (repeatMode === 'one') {
        nextIndex = queueIndex;
      } else if (shuffleEnabled) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') nextIndex = 0;
          else {
            audioService.pause();
            await audioService.seekTo(0);
            set({ isPlaying: false, position: 0 });
            return;
          }
        }
      }

      const nextTrack = queue[nextIndex];
      await audioService.load(nextTrack.uri);
      audioService.play();
      set({ currentTrack: nextTrack, isPlaying: true, queueIndex: nextIndex, position: 0, duration: 0 });
    },

    skipPrev: async () => {
      const { queue, queueIndex, position } = get();
      // If more than 3 seconds in, restart current track
      if (position > 3) {
        await audioService.seekTo(0);
        set({ position: 0 });
        return;
      }
      const prevIndex = Math.max(0, queueIndex - 1);
      const prevTrack = queue[prevIndex];
      if (!prevTrack) return;
      await audioService.load(prevTrack.uri);
      audioService.play();
      set({ currentTrack: prevTrack, isPlaying: true, queueIndex: prevIndex, position: 0, duration: 0 });
    },

    seekTo: async (position) => {
      await audioService.seekTo(position);
      set({ position });
    },

    toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),

    cycleRepeat: () =>
      set((s) => ({
        repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
      })),

    jumpTo: async (index) => {
      const { queue } = get();
      const track = queue[index];
      if (!track) return;
      await audioService.load(track.uri);
      audioService.play();
      set({ currentTrack: track, isPlaying: true, queueIndex: index, position: 0, duration: 0 });
    },

    addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

    removeFromQueue: (index) =>
      set((s) => ({ queue: s.queue.filter((_, i) => i !== index) })),

    reorderQueue: (from, to) =>
      set((s) => {
        const queue = [...s.queue];
        const [moved] = queue.splice(from, 1);
        queue.splice(to, 0, moved);
        return { queue };
      }),

    updateCurrentTrackArtwork: (artworkUri) =>
      set((s) =>
        s.currentTrack ? { currentTrack: { ...s.currentTrack, artworkUri } } : {},
      ),

    _setPosition: (position, duration) => set({ position, duration }),

    _handleFinish: async () => {
      await get().skipNext();
    },
  };
});
