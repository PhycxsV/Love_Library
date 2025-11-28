import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E91E63', // Romantic red - main brand color
    secondary: '#FCE4EC', // Very subtle light pink accent (reduced)
    tertiary: '#FFF0F5', // Very light pink tint
    background: '#FFF5F8', // Very light red tint background
    surface: '#FFFBFD', // Very light pink-red tint for cards
    surfaceVariant: '#FFF8FA', // Light pink-red tint for surface variants
    error: '#F44336',
    onPrimary: '#FFFFFF', // White text on red
    onSecondary: '#E91E63', // Red text on pink
    onBackground: '#1A1A1A', // Almost black text
    onSurface: '#1A1A1A', // Almost black text
  },
};

