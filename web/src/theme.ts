import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#6F4E37', // Coffee Brown - main brand color
      light: '#8B6F47', // Lighter brown for hover states
      dark: '#5A3E2A', // Darker brown for active states
    },
    secondary: {
      main: '#C9A961', // Warm golden tan
      light: '#E8C9A0', // Light tan
      dark: '#B8935F', // Darker tan
    },
    background: {
      default: '#F5F1EB', // Warm cream background
      paper: '#FFFFFF', // White for cards/paper
    },
    text: {
      primary: '#3E2723', // Dark brown for text
      secondary: '#5D4037', // Medium brown for secondary text
    },
    // Custom colors for accents
    info: {
      main: '#D4AF37', // Gold accent
    },
    success: {
      main: '#8B9A46', // Olive green
      light: '#A8B86A',
      dark: '#6B7A2E',
    },
    warning: {
      main: '#D4A574', // Warm amber
      light: '#E8C9A0',
      dark: '#B8935F',
    },
    error: {
      main: '#C97D60', // Warm terracotta
      light: '#E5A082',
      dark: '#A85D3F',
    },
  },
});

