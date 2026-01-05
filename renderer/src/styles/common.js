import { colors, typography, spacing, borderRadius, shadows, transitions } from './theme';

// ============================================
// Button Styles
// ============================================

export const buttonBase = {
  cursor: 'pointer',
  border: 'none',
  borderRadius: borderRadius.md,
  fontWeight: typography.fontWeight.medium,
  transition: `all ${transitions.normal}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const buttonPrimary = {
  ...buttonBase,
  padding: '12px 24px',
  backgroundColor: colors.primary,
  color: colors.white,
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.bold,
  boxShadow: shadows.sm,
};

export const buttonSecondary = {
  ...buttonBase,
  padding: '10px 20px',
  backgroundColor: colors.white,
  color: colors.textSecondary,
  border: `1px solid ${colors.borderDark}`,
  fontSize: typography.fontSize.sm,
};

export const buttonDanger = {
  ...buttonBase,
  padding: '10px 20px',
  backgroundColor: colors.error,
  color: colors.white,
  fontSize: typography.fontSize.sm,
};

export const buttonIcon = {
  ...buttonBase,
  padding: '4px 8px',
  backgroundColor: 'transparent',
  border: 'none',
};

// ============================================
// Input Styles
// ============================================

export const inputBase = {
  padding: spacing.lg,
  fontSize: typography.fontSize.base,
  border: `1px solid ${colors.borderDark}`,
  borderRadius: borderRadius.md,
  outline: 'none',
  transition: `border-color ${transitions.normal}`,
};

export const inputStandard = {
  ...inputBase,
  width: '100%',
};

export const inputTitle = {
  width: '100%',
  padding: `${spacing.lg} 0`,
  fontSize: typography.fontSize.xl,
  fontFamily: typography.fontFamily.primary,
  border: 'none',
  borderBottom: `1px solid ${colors.borderDark}`,
  outline: 'none',
  backgroundColor: 'transparent',
  color: colors.black,
  transition: `border-color ${transitions.normal}`,
};

export const textareaBase = {
  width: '100%',
  padding: spacing['2xl'],
  fontFamily: typography.fontFamily.monospace,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.md,
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.normal,
  resize: 'none',
  backgroundColor: colors.backgroundSecondary,
};

export const selectBase = {
  width: '100%',
  padding: `${spacing.lg} ${spacing.xl}`,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.xl,
  fontSize: typography.fontSize.sm,
  backgroundColor: colors.white,
  cursor: 'pointer',
  outline: 'none',
};

// ============================================
// Card Styles
// ============================================

export const cardBase = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  boxShadow: shadows.md,
};

export const cardWithPadding = {
  ...cardBase,
  padding: spacing['3xl'],
};

export const cardHighlight = {
  ...cardBase,
  padding: spacing['4xl'],
  backgroundColor: colors.backgroundSecondary,
};

// ============================================
// Modal Styles
// ============================================

export const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

export const modalContent = {
  backgroundColor: colors.white,
  borderRadius: borderRadius.xl,
  width: '90%',
  maxWidth: '1000px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: shadows.modal,
};

export const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing['3xl']} ${spacing['5xl']}`,
  borderBottom: `1px solid ${colors.border}`,
};

export const modalCloseButton = {
  backgroundColor: colors.error,
  color: colors.white,
  border: 'none',
  borderRadius: borderRadius.md,
  width: '40px',
  height: '40px',
  fontSize: '28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: typography.fontWeight.bold,
  transition: `background-color ${transitions.normal}`,
};

// ============================================
// Navigation Styles
// ============================================

export const navLink = (active) => ({
  background: 'none',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  cursor: 'pointer',
  padding: `${spacing.md} 5px`,
  color: active ? colors.primary : colors.textSecondary,
  fontFamily: typography.fontFamily.secondary,
  fontSize: typography.fontSize.base,
  transition: `all ${transitions.normal}`,
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '0.5px',
  fontWeight: typography.fontWeight.medium,
});

export const topNav = {
  padding: `${spacing['2xl']} ${spacing['5xl']}`,
  backgroundColor: colors.white,
  boxShadow: shadows.lg,
  zIndex: 10,
};

// ============================================
// Search Styles
// ============================================

export const searchContainer = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: spacing['6xl'],
};

export const searchWrapper = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '700px',
  border: `1px solid ${colors.borderMedium}`,
  borderRadius: borderRadius.full,
  padding: `${spacing.xl} ${spacing['3xl']}`,
  backgroundColor: colors.white,
  boxShadow: shadows.xl,
  transition: `border-color ${transitions.normal}, box-shadow ${transitions.normal}`,
};

export const searchInput = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: typography.fontSize.md,
  backgroundColor: 'transparent',
  color: colors.text,
};

export const searchDropdown = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  backgroundColor: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius['2xl'],
  boxShadow: shadows['3xl'],
  maxHeight: '450px',
  overflowY: 'auto',
  zIndex: 1000,
};

export const searchSuggestionItem = {
  padding: `14px 18px`,
  cursor: 'pointer',
  borderBottom: `1px solid ${colors.backgroundTertiary}`,
  transition: `background-color ${transitions.fast}`,
};

// ============================================
// Label & Form Styles
// ============================================

export const label = {
  display: 'block',
  fontSize: typography.fontSize.sm,
  textTransform: 'uppercase',
  color: colors.textMuted,
  fontWeight: typography.fontWeight.bold,
  marginBottom: spacing.md,
  letterSpacing: '0.5px',
};

export const fieldGroup = {
  marginBottom: spacing['3xl'],
};

// ============================================
// Tag/Badge Styles
// ============================================

export const tagBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: colors.primaryLight,
  color: colors.primaryDark,
  padding: `${spacing.xs} ${spacing.lg}`,
  borderRadius: borderRadius['2xl'],
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
};

export const tagBadgeSmall = {
  backgroundColor: colors.backgroundTertiary,
  color: colors.textSecondary,
  padding: `${spacing.xs} ${spacing.md}`,
  borderRadius: borderRadius.lg,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
};

export const roleBadge = (isAdmin) => ({
  backgroundColor: isAdmin ? colors.primaryLight : colors.secondaryLight,
  color: isAdmin ? colors.primaryDark : colors.secondary,
  padding: `${spacing.xs} ${spacing.md}`,
  borderRadius: borderRadius.lg,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
});

// ============================================
// List Styles
// ============================================

export const listReset = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

export const listItem = {
  marginBottom: spacing['3xl'],
  paddingBottom: spacing['3xl'],
  borderBottom: `1px solid ${colors.borderLight}`,
};

// ============================================
// Link Styles
// ============================================

export const linkStyle = {
  fontSize: typography.fontSize.md,
  fontWeight: typography.fontWeight.bold,
  color: colors.link,
  textDecoration: 'none',
  fontFamily: typography.fontFamily.primary,
  cursor: 'pointer',
  transition: `text-decoration ${transitions.normal}`,
};

// ============================================
// Section Styles
// ============================================

export const sectionHeader = {
  fontFamily: typography.fontFamily.secondary,
  fontSize: typography.fontSize.lg,
  color: colors.text,
  borderBottom: `2px solid ${colors.primary}`,
  paddingBottom: spacing.lg,
  marginBottom: spacing['3xl'],
  fontWeight: typography.fontWeight.semibold,
  display: 'flex',
  alignItems: 'center',
};

export const sectionCard = {
  border: `1px solid ${colors.border}`,
  padding: spacing['3xl'],
  backgroundColor: colors.white,
  borderRadius: borderRadius.md,
  minHeight: '400px',
  boxShadow: shadows.md,
};

// ============================================
// Tab Styles
// ============================================

export const tabButton = (active) => ({
  padding: `${spacing.lg} 5px`,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  borderBottom: active ? `3px solid ${colors.primary}` : '3px solid transparent',
  color: active ? colors.primary : colors.textSecondary,
  fontWeight: typography.fontWeight.bold,
  fontSize: typography.fontSize.base,
  transition: `all ${transitions.normal}`,
  marginRight: spacing.lg,
});

// ============================================
// Segmented Control Styles
// ============================================

export const segmentedControl = {
  display: 'flex',
  backgroundColor: colors.backgroundTertiary,
  borderRadius: borderRadius.xl,
  padding: spacing.xs,
  gap: spacing.xs,
};

export const segmentButton = (active) => ({
  flex: 1,
  padding: `${spacing.md} ${spacing.xl}`,
  border: 'none',
  borderRadius: borderRadius.lg,
  backgroundColor: active ? colors.white : 'transparent',
  color: active ? colors.primary : colors.textSecondary,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  cursor: 'pointer',
  transition: `all ${transitions.normal}`,
  boxShadow: active ? shadows.sm : 'none',
});

// ============================================
// Alert Styles
// ============================================

export const alertDanger = {
  backgroundColor: colors.errorLight,
  color: colors.errorText,
  padding: spacing.lg,
  textAlign: 'center',
  borderBottom: `1px solid #ef9a9a`,
  fontWeight: typography.fontWeight.bold,
};

// ============================================
// User Status Badge
// ============================================

export const userStatusBadge = {
  fontSize: typography.fontSize.sm,
  color: colors.textSecondary,
  backgroundColor: colors.backgroundTertiary,
  padding: `${spacing.sm} ${spacing.xl}`,
  borderRadius: borderRadius.full,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
};

export const onlineIndicator = {
  width: '8px',
  height: '8px',
  borderRadius: borderRadius.circle,
  backgroundColor: colors.success,
  display: 'inline-block',
};

// ============================================
// Resizer Handle
// ============================================

export const resizerHandle = {
  width: '4px',
  cursor: 'col-resize',
  backgroundColor: colors.border,
  transition: `background-color ${transitions.normal}`,
  zIndex: 10,
};
