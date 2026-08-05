// Theme System supporting Dual Themes: Light Academic & Deep Royal Violet Glass Dark

export const LIGHT_THEME = {
  mode: 'light',
  colors: {
    bgDark: '#F8FAFC',
    bgDarker: '#F1F5F9',
    bgCard: '#FFFFFF',
    bgCardHover: '#F8FAFC',
    bgGlass: 'rgba(255, 255, 255, 0.95)',
    bgGlassElevated: '#FFFFFF',

    glassBorder: '#E2E8F0',
    glassBorderActive: '#6366F1',
    glassBorderAccent: '#3B82F6',

    primary: '#4F46E5',
    accentBlue: '#2563EB',
    icyCyan: '#0284C7',
    emeraldGreen: '#10B981',
    amberYellow: '#D97706',
    roseRed: '#E11D48',
    amethystViolet: '#7C3AED',

    textMain: '#0F172A',
    textSub: '#475569',
    textMuted: '#64748B',
    textAccent: '#4F46E5',
    
    headerBg: '#FFFFFF',
    headerBorder: '#E2E8F0',
    tabBarBg: 'rgba(255, 255, 255, 0.92)',
    tabBarBorder: '#E2E8F0',
    cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
};

export const DARK_THEME = {
  mode: 'dark',
  colors: {
    bgDark: '#0B0E17',
    bgDarker: '#060911',
    bgCard: '#151C2C',
    bgCardHover: '#1C263B',
    bgGlass: 'rgba(21, 28, 44, 0.92)',
    bgGlassElevated: 'rgba(28, 38, 59, 0.95)',

    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassBorderActive: '#3B82F6',
    glassBorderAccent: '#1C263B',

    primary: '#3B82F6',
    accentBlue: '#2563EB',
    icyCyan: '#38BDF8',
    emeraldGreen: '#10B981',
    amberYellow: '#F59E0B',
    roseRed: '#EF4444',
    amethystViolet: '#60A5FA',

    textMain: '#FFFFFF',
    textSub: '#8295B5',
    textMuted: '#5F7296',
    textAccent: '#38BDF8',

    headerBg: 'rgba(11, 14, 23, 0.96)',
    headerBorder: 'rgba(255, 255, 255, 0.08)',
    tabBarBg: 'rgba(11, 14, 23, 0.96)',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    cardShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
  },
};

export const getTheme = (mode) => (mode === 'light' ? LIGHT_THEME : DARK_THEME);
