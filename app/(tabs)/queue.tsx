import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function QueueScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Queue</Text>
        </View>
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.muted }]}>
            No tracks in queue
          </Text>
          <Text style={[styles.placeholderSub, { color: colors.muted }]}>
            Play a song to get started
          </Text>
        </View>
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
    paddingBottom: 100,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholderSub: {
    fontSize: 14,
  },
});
