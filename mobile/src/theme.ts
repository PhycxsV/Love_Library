import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E91E63', // Romantic red - main brand color
    secondary: '#F8BBD0', // Light pink accent
    tertiary: '#FCE4EC', // Very light pink
    background: '#FAFAFA', // Clean light gray background
    surface: '#FFFFFF', // White for cards
    surfaceVariant: '#F5F5F5', // Light gray for surface variants
    error: '#F44336',
    onPrimary: '#FFFFFF', // White text on red
    onSecondary: '#E91E63', // Red text on pink
    onBackground: '#1A1A1A', // Almost black text
    onSurface: '#1A1A1A', // Almost black text
  },
};

