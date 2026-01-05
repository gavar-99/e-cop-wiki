// Color palette
export const colors = {
  // Primary colors
  primary: '#36c',
  primaryHover: '#2558a8',
  primaryLight: '#e3f2fd',
  primaryDark: '#1565c0',

  // Secondary colors
  secondary: '#7b1fa2',
  secondaryLight: '#f3e5f5',

  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#dc3545',
  errorHover: '#f44336',
  errorLight: '#ffebee',
  errorText: '#c62828',

  // Neutral colors
  white: '#fff',
  black: '#000',
  text: '#202122',
  textSecondary: '#54595d',
  textMuted: '#72777d',
  textLight: '#999',

  // Link colors
  link: '#0645ad',
  linkHover: '#1565c0',

  // Background colors
  background: '#fff',
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#f0f2f5',
  backgroundHover: '#f0f6ff',

  // Border colors
  border: '#e1e4e8',
  borderLight: '#eaecf0',
  borderMedium: '#a2a9b1',
  borderDark: '#ccc',

  // Accent colors for customization
  accentColors: [
    { name: 'Blue', value: '#3366cc' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Green', value: '#059669' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Indigo', value: '#4f46e5' },
  ],
};

// Typography
export const typography = {
  fontFamily: {
    primary: "'Linux Libertine', Georgia, serif",
    secondary: 'Arial, sans-serif',
    monospace: 'monospace',
    display: 'Milker',
  },
  fontSize: {
    xs: '0.75em',
    sm: '0.85em',
    base: '1em',
    md: '1.05em',
    lg: '1.1em',
    xl: '1.5em',
    '2xl': '1.8em',
    '3xl': '2.2em',
    '4xl': '2.4em',
    '5xl': '2.5em',
  },
  fontWeight: {
    normal: 'normal',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
  lineHeight: {
    tight: 1,
    snug: 1.4,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.7,
  },
};

// Spacing
export const spacing = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '15px',
  '3xl': '20px',
  '4xl': '24px',
  '5xl': '30px',
  '6xl': '40px',
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '6px',
  xl: '8px',
  '2xl': '12px',
  full: '20px',
  circle: '50%',
};

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.1)',
  md: '0 1px 3px rgba(0,0,0,0.05)',
  lg: '0 2px 4px rgba(0,0,0,0.02)',
  xl: '0 4px 8px rgba(0,0,0,0.1)',
  '2xl': '0 4px 12px rgba(0,0,0,0.15)',
  '3xl': '0 8px 24px rgba(0,0,0,0.15)',
  modal: '0 10px 40px rgba(0,0,0,0.3)',
};

// Transitions
export const transitions = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s',
};

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  titleBar: 9999,
};

// Breakpoints (for reference)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Export combined theme
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
};

export default theme;
