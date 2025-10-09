/**
 * Design Tokens - Premium Design System
 * Inspired by Jonathan Ive's design philosophy: Simplicity, Premium Materials, Purposeful Function
 */

// Color System - Premium Neutral Palette
export const colors = {
  // Primary Colors
  primary: {
    charcoal: '#1a1a1a',      // Main text, headers
    slate: '#64748b',         // Supporting text
    blue: '#1d4ed8',          // Progress, active states
    green: '#059669',         // Success, completion
    amber: '#f59e0b',         // Warning, attention states
  },
  
  // Surface Colors
  surface: {
    primary: '#ffffff',       // Main backgrounds
    secondary: '#f8fafc',     // Subtle backgrounds
    tertiary: '#f1f5f9',      // Card backgrounds
    quaternary: '#e2e8f0',    // Subtle accents
  },
  
  // Border Colors
  border: {
    light: '#e2e8f0',         // Subtle divisions
    medium: '#cbd5e1',        // Standard borders
    strong: '#94a3b8',        // Emphasis borders
  },
  
  // Text Colors
  text: {
    primary: '#1a1a1a',       // Main text
    secondary: '#64748b',     // Supporting text
    tertiary: '#94a3b8',      // Subtle text
    inverse: '#ffffff',       // White text on dark backgrounds
  },
  
  // State Colors
  state: {
    success: '#059669',       // Success states
    warning: '#f59e0b',       // Warning states
    error: '#dc2626',         // Error states
    info: '#1d4ed8',          // Informational states
  },
  
  // Shadow Colors
  shadow: {
    light: 'rgba(15, 23, 42, 0.04)',
    medium: 'rgba(15, 23, 42, 0.08)',
    strong: 'rgba(15, 23, 42, 0.12)',
  }
} as const;

// Typography System
export const typography = {
  fontSizes: {
    display: '32px',     // Large headings
    h1: '24px',         // Page titles
    h2: '20px',         // Section headings
    h3: '18px',         // Subsection headings
    bodyLarge: '16px',  // Large body text
    body: '14px',       // Standard body text
    bodySmall: '12px',  // Small text
    caption: '11px',    // Caption text
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    snug: '-0.020em',
    normal: '0',
    wide: '0.010em',
    wider: '0.015em',
  },
  
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  }
} as const;

// Spacing System (8px base unit)
export const spacing = {
  xs: '4px',    // 0.5 units
  sm: '8px',    // 1 unit
  md: '16px',   // 2 units
  lg: '24px',   // 3 units
  xl: '32px',   // 4 units
  '2xl': '48px', // 6 units
  '3xl': '64px', // 8 units
  '4xl': '96px', // 12 units
} as const;

// Border Radius System
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Shadow System
export const shadows = {
  none: 'none',
  sm: `0 1px 2px 0 ${colors.shadow.light}`,
  md: `0 4px 6px -1px ${colors.shadow.medium}`,
  lg: `0 10px 15px -3px ${colors.shadow.medium}`,
  xl: `0 20px 25px -5px ${colors.shadow.strong}`,
  inner: `inset 0 2px 4px 0 ${colors.shadow.light}`,
} as const;

// Animation & Transitions
export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const;

// Component-specific tokens
export const components = {
  // Button variants
  button: {
    primary: {
      backgroundColor: colors.primary.blue,
      color: colors.text.inverse,
      border: 'none',
      shadow: shadows.sm,
      borderRadius: borderRadius.lg,
    },
    secondary: {
      backgroundColor: colors.surface.primary,
      color: colors.text.primary,
      border: `1px solid ${colors.border.light}`,
      shadow: shadows.sm,
      borderRadius: borderRadius.lg,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      border: 'none',
      shadow: 'none',
      borderRadius: borderRadius.lg,
    }
  },
  
  // Card variants
  card: {
    primary: {
      backgroundColor: colors.surface.primary,
      border: `1px solid ${colors.border.light}`,
      shadow: shadows.md,
      borderRadius: borderRadius.xl,
    },
    secondary: {
      backgroundColor: colors.surface.secondary,
      border: 'none',
      shadow: shadows.sm,
      borderRadius: borderRadius.lg,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      border: `1px solid rgba(255, 255, 255, 0.2)`,
      shadow: shadows.lg,
      borderRadius: borderRadius.xl,
    }
  },
  
  // Input variants
  input: {
    default: {
      backgroundColor: colors.surface.primary,
      border: `1px solid ${colors.border.light}`,
      borderRadius: borderRadius.lg,
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: typography.fontSizes.body,
    }
  }
} as const;

// Utility classes for common patterns
export const utilityClasses = {
  // Glass morphism effect
  glassMorphism: 'bg-white/80 backdrop-blur-sm border border-slate-200/50',
  
  // Premium card styling
  premiumCard: 'bg-white border border-slate-200/50 rounded-2xl shadow-sm shadow-slate-900/5',
  
  // Smooth transitions
  smoothTransition: 'transition-all duration-300 ease-in-out',
  springTransition: 'transition-all duration-300 cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Text hierarchy
  displayText: 'text-3xl font-semibold text-slate-900 tracking-tight',
  headingText: 'text-xl font-medium text-slate-900 tracking-tight',
  bodyText: 'text-sm text-slate-700',
  captionText: 'text-xs font-medium text-slate-500 tracking-wide',
  
  // Interactive states
  interactiveHover: 'hover:scale-[1.02] hover:shadow-md transition-all duration-200',
  buttonHover: 'hover:scale-105 active:scale-95 transition-transform duration-150',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
  
  // Loading states
  skeleton: 'animate-pulse bg-slate-200 rounded',
} as const;

// Breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
  utilityClasses,
  breakpoints,
  zIndex,
} as const;

// Type exports for TypeScript support
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type DesignTokens = typeof designTokens;