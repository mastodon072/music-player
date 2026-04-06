import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Props {
  uri?: string;
  size?: number;
  borderRadius?: number;
}

export function ArtworkImage({ uri, size, borderRadius = 16 }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius,
      ...(size ? { width: size, height: size } : {}),
    },
  ];

  if (!uri) {
    return (
      <View style={containerStyle}>
        <IconSymbol name="music.note.list" size={48} color={colors.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[containerStyle, { borderWidth: 0 }]}
      contentFit="cover"
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
