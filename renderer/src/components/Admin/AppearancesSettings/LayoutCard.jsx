import React from 'react';
import { Layout } from 'lucide-react';
import { colors, typography, spacing, borderRadius, transitions } from '../../../styles/theme';

const LayoutCard = ({
  sidebarPosition,
  contentWidth,
  spacingOption,
  defaultView,
  onSidebarPositionChange,
  onContentWidthChange,
  onSpacingChange,
  onDefaultViewChange,
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <Layout size={20} style={{ color: colors.primary }} />
        <h4 style={styles.title}>Layout</h4>
      </div>

      {/* Sidebar Position */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Sidebar Position</label>
        <div style={styles.segmentedControl}>
          {['left', 'right'].map((pos) => (
            <button
              key={pos}
              style={{
                ...styles.segmentButton,
                ...(sidebarPosition === pos ? styles.segmentButtonActive : {}),
              }}
              onClick={() => onSidebarPositionChange(pos)}
            >
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Width */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Content Width</label>
        <div style={styles.segmentedControl}>
          {['narrow', 'medium', 'wide'].map((width) => (
            <button
              key={width}
              style={{
                ...styles.segmentButton,
                ...(contentWidth === width ? styles.segmentButtonActive : {}),
              }}
              onClick={() => onContentWidthChange(width)}
            >
              {width.charAt(0).toUpperCase() + width.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Spacing</label>
        <div style={styles.segmentedControl}>
          {['compact', 'comfortable', 'spacious'].map((s) => (
            <button
              key={s}
              style={{
                ...styles.segmentButton,
                ...(spacingOption === s ? styles.segmentButtonActive : {}),
              }}
              onClick={() => onSpacingChange(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Default View */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Default View</label>
        <div style={styles.segmentedControl}>
          <button
            style={{
              ...styles.segmentButton,
              ...(defaultView === 'dashboard' ? styles.segmentButtonActive : {}),
            }}
            onClick={() => onDefaultViewChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            style={{
              ...styles.segmentButton,
              ...(defaultView === 'lastViewed' ? styles.segmentButtonActive : {}),
            }}
            onClick={() => onDefaultViewChange('lastViewed')}
          >
            Last Viewed
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['3xl'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: `1px solid #e8e8e8`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
    paddingBottom: spacing.xl,
    borderBottom: `1px solid ${colors.backgroundTertiary}`,
  },
  title: {
    margin: 0,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  fieldGroup: {
    marginBottom: spacing['3xl'],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    display: 'block',
  },
  segmentedControl: {
    display: 'flex',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    padding: `${spacing.md} ${spacing.xl}`,
    border: 'none',
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },
  segmentButtonActive: {
    backgroundColor: colors.white,
    color: colors.primary,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

export default LayoutCard;
