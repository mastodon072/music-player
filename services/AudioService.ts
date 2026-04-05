import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer as ExpoAudioPlayer, AudioStatus } from 'expo-audio';

type PlaybackUpdateCallback = (position: number, duration: number) => void;
type FinishCallback = () => void;

class AudioService {
  private player: ExpoAudioPlayer | null = null;
  private subscription: { remove: () => void } | null = null;
  private onPlaybackUpdateCallback: PlaybackUpdateCallback | null = null;
  private onFinishCallback: FinishCallback | null = null;

  async configure() {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    });
  }

  setOnPlaybackUpdate(cb: PlaybackUpdateCallback) {
    this.onPlaybackUpdateCallback = cb;
  }

  setOnFinish(cb: FinishCallback) {
    this.onFinishCallback = cb;
  }

  private handleStatus = (status: AudioStatus) => {
    if (!status.isLoaded) return;
    this.onPlaybackUpdateCallback?.(status.currentTime, status.duration);
    if (status.didJustFinish) {
      this.onFinishCallback?.();
    }
  };

  async load(uri: string) {
    // Release previous player and subscription before creating a new one
    this.subscription?.remove();
    this.player?.remove();

    this.player = createAudioPlayer({ uri });
    this.subscription = this.player.addListener('playbackStatusUpdate', this.handleStatus);
  }

  play() {
    this.player?.play();
  }

  pause() {
    this.player?.pause();
  }

  async seekTo(seconds: number) {
    await this.player?.seekTo(seconds);
  }

  unload() {
    this.subscription?.remove();
    this.player?.remove();
    this.player = null;
    this.subscription = null;
  }
}

export const audioService = new AudioService();
