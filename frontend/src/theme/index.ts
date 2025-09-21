import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Flex Living Brand Colors (from existing globals.css)
const flexColors = {
  primary: '#323927',
  primaryDark: '#282E1F',
  accent: '#D4F872',
  accentHover: '#c4e862',
  bgPrimary: '#FBFAF9',
  bgSecondary: '#F5F3EF',
  textPrimary: '#323927',
  textSecondary: '#93968B',
  textMuted: '#CECEC7',
  white: '#ffffff',
  black: '#000000',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
};

// Extended color palette for modern UI
const extendedColors = {
  ...flexColors,
  // Semantic colors
  background: {
    default: flexColors.bgPrimary,
    paper: flexColors.white,
    secondary: flexColors.bgSecondary,
  },
  text: {
    primary: flexColors.textPrimary,
    secondary: flexColors.textSecondary,
    disabled: flexColors.textMuted,
  },
  // Action colors
  action: {
    hover: alpha(flexColors.primary, 0.04),
    selected: alpha(flexColors.accent, 0.12),
    disabled: alpha(flexColors.textMuted, 0.26),
    disabledBackground: alpha(flexColors.textMuted, 0.12),
  },
  // Divider
  divider: alpha(flexColors.textMuted, 0.12),
};

// Typography configuration
const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    color: flexColors.primary,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    color: flexColors.primary,
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    color: flexColors.primary,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4,
    color: flexColors.primary,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: flexColors.primary,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
    color: flexColors.primary,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: flexColors.textPrimary,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: flexColors.textSecondary,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: flexColors.textSecondary,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    textTransform: 'none' as const,
  },
};

// Component customizations
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        textTransform: 'none' as const,
        fontWeight: 500,
        padding: '10px 20px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
      containedPrimary: {
        backgroundColor: flexColors.primary,
        color: flexColors.white,
        '&:hover': {
          backgroundColor: flexColors.primaryDark,
        },
      },
      containedSecondary: {
        backgroundColor: flexColors.accent,
        color: flexColors.primary,
        '&:hover': {
          backgroundColor: flexColors.accentHover,
        },
      },
      outlined: {
        borderColor: flexColors.textMuted,
        color: flexColors.textPrimary,
        '&:hover': {
          borderColor: flexColors.primary,
          backgroundColor: alpha(flexColors.primary, 0.04),
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${alpha(flexColors.textMuted, 0.1)}`,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: '20px',
        fontWeight: 500,
      },
      filled: {
        backgroundColor: flexColors.bgSecondary,
        color: flexColors.textPrimary,
      },
      outlined: {
        borderColor: flexColors.textMuted,
        color: flexColors.textSecondary,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '& fieldset': {
            borderColor: flexColors.textMuted,
          },
          '&:hover fieldset': {
            borderColor: flexColors.textSecondary,
          },
          '&.Mui-focused fieldset': {
            borderColor: flexColors.accent,
          },
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        borderBottom: `2px solid ${flexColors.bgSecondary}`,
      },
      indicator: {
        backgroundColor: flexColors.accent,
        height: '3px',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontWeight: 500,
        color: flexColors.textSecondary,
        '&.Mui-selected': {
          color: flexColors.primary,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        color: flexColors.textSecondary,
        '&:hover': {
          backgroundColor: alpha(flexColors.accent, 0.1),
          color: flexColors.primary,
        },
      },
    },
  },
};

// Create the theme
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: flexColors.primary,
      dark: flexColors.primaryDark,
      contrastText: flexColors.white,
    },
    secondary: {
      main: flexColors.accent,
      dark: flexColors.accentHover,
      contrastText: flexColors.primary,
    },
    background: extendedColors.background,
    text: extendedColors.text,
    action: extendedColors.action,
    divider: extendedColors.divider,
    success: {
      main: flexColors.success,
    },
    warning: {
      main: flexColors.warning,
    },
    error: {
      main: flexColors.error,
    },
    info: {
      main: flexColors.info,
    },
  },
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
};

export const theme = createTheme(themeOptions);

// Export colors for use in custom components
export { flexColors, extendedColors };

// Custom breakpoints (matching existing responsive design)
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

// Custom shadows
export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.15)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.2)',
};

// Animation durations
export const transitions = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
};
