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
    bgDark: '#120B2E',
    bgDarker: '#0B061E',
    bgCard: 'rgba(30, 20, 60, 0.85)',
    bgCardHover: 'rgba(45, 30, 85, 0.9)',
    bgGlass: 'rgba(20, 12, 45, 0.75)',
    bgGlassElevated: 'rgba(38, 25, 75, 0.85)',

    glassBorder: 'rgba(255, 255, 255, 0.12)',
    glassBorderActive: '#A855F7',
    glassBorderAccent: '#C084FC',

    primary: '#A855F7',
    accentBlue: '#38BDF8',
    icyCyan: '#38BDF8',
    emeraldGreen: '#10B981',
    amberYellow: '#F59E0B',
    roseRed: '#F43F5E',
    amethystViolet: '#C084FC',

    textMain: '#F8FAFC',
    textSub: '#CBD5E1',
    textMuted: '#94A3B8',
    textAccent: '#C084FC',

    headerBg: 'rgba(18, 11, 46, 0.95)',
    headerBorder: 'rgba(255, 255, 255, 0.1)',
    tabBarBg: 'rgba(20, 12, 45, 0.88)',
    tabBarBorder: 'rgba(255, 255, 255, 0.15)',
    cardShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
  },
};

export const getTheme = (mode) => (mode === 'light' ? LIGHT_THEME : DARK_THEME);
