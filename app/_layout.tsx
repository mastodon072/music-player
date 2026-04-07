import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/MiniPlayer';
import { useColorScheme } from '@/hooks/useColorScheme';

// Height of the iOS tab bar strip (without the home indicator safe area)
const TAB_BAR_HEIGHT = 49;

// Paths where the tab bar is visible — MiniPlayer must sit above it
const TAB_PATHS = ['/', '/search', '/queue'];

function MiniPlayerOverlay() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hide while the full-screen player is open
  if (pathname === '/player') return null;

  const isTabScreen = TAB_PATHS.includes(pathname);
  const bottomOffset = isTabScreen
    ? TAB_BAR_HEIGHT + insets.bottom   // above tab bar + home indicator
    : insets.bottom + 8;               // above home indicator on stack screens

  return (
    <View style={[styles.overlay, { bottom: bottomOffset }]} pointerEvents="box-none">
      <MiniPlayer />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="library/songs" options={{ headerShown: false }} />
        <Stack.Screen name="library/albums" options={{ headerShown: false }} />
        <Stack.Screen name="library/album/[name]" options={{ headerShown: false }} />
        <Stack.Screen name="library/artists" options={{ headerShown: false }} />
        <Stack.Screen name="library/artist/[name]" options={{ headerShown: false }} />
        <Stack.Screen name="library/playlists" options={{ headerShown: false }} />
        <Stack.Screen name="library/playlist/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <MiniPlayerOverlay />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
