import React from 'react';
import { Type } from 'lucide-react';
import { colors, typography, spacing, borderRadius, transitions } from '../../../styles/theme';

const TypographyCard = ({
  fontFamily,
  fontSize,
  lineHeight,
  onFontFamilyChange,
  onFontSizeChange,
  onLineHeightChange,
}) => {
  const fontFamilies = [
    { label: 'Linux Libertine', value: 'Linux Libertine' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Verdana', value: 'Verdana' },
    { label: 'System Default', value: 'System' },
  ];

  const fontSizes = ['small', 'medium', 'large'];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <Type size={20} style={{ color: colors.primary }} />
        <h4 style={styles.title}>Typography</h4>
      </div>

      {/* Font Family */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          style={styles.select}
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Font Size</label>
        <div style={styles.segmentedControl}>
          {fontSizes.map((size) => (
            <button
              key={size}
              style={{
                ...styles.segmentButton,
                ...(fontSize === size ? styles.segmentButtonActive : {}),
              }}
              onClick={() => onFontSizeChange(size)}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Line Height
          <span style={styles.valueDisplay}>{lineHeight}</span>
        </label>
        <input
          type="range"
          min="1"
          max="2"
          step="0.1"
          value={lineHeight}
          onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
          style={styles.range}
        />
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueDisplay: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    backgroundColor: '#e8f0fe',
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.md,
  },
  select: {
    width: '100%',
    padding: `${spacing.lg} ${spacing.xl}`,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.xl,
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.white,
    cursor: 'pointer',
    outline: 'none',
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
  range: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    appearance: 'none',
    backgroundColor: colors.border,
    outline: 'none',
    cursor: 'pointer',
  },
};

export default TypographyCard;
