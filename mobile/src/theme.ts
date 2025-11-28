import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6F4E37', // Coffee Brown - main brand color
    secondary: '#D4A574', // Warm tan/beige
    tertiary: '#D4AF37', // Gold accent
    background: '#F5F1EB', // Warm cream background
    surface: '#FFFFFF', // White for cards
    surfaceVariant: '#F5F1EB', // Cream for surface variants
    error: '#B00020',
    onPrimary: '#FFFFFF', // White text on brown
    onSecondary: '#3E2723', // Dark brown text on tan
    onBackground: '#3E2723', // Dark brown text
    onSurface: '#3E2723', // Dark brown text
  },
};

