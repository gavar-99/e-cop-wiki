import React from 'react';
import { Eye } from 'lucide-react';
import { colors, typography, spacing, borderRadius, transitions } from '../../../styles/theme';

const PreviewCard = ({ preferences }) => {
  const getFontFamily = () => {
    return preferences.fontFamily === 'System' ? 'system-ui' : preferences.fontFamily;
  };

  const getFontSize = () => {
    switch (preferences.fontSize) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  };

  return (
    <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
      <div style={styles.header}>
        <Eye size={20} style={{ color: colors.primary }} />
        <h4 style={styles.title}>Live Preview</h4>
      </div>
      <div
        style={{
          ...styles.previewBox,
          fontFamily: getFontFamily(),
          fontSize: getFontSize(),
          lineHeight: preferences.lineHeight,
          borderLeftColor: preferences.accentColor,
          backgroundColor: preferences.theme === 'dark' ? '#1a1a2e' : colors.backgroundSecondary,
          color: preferences.theme === 'dark' ? colors.border : colors.text,
        }}
      >
        <h5
          style={{
            color: preferences.accentColor,
            margin: `0 0 ${spacing.xl} 0`,
            fontSize: '1.2em',
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Sample Wiki Article
        </h5>
        <p style={{ margin: `0 0 ${spacing.xl} 0`, opacity: 0.9 }}>
          This is how your content will look with the selected appearance settings. The quick
          brown fox jumps over the lazy dog.
        </p>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
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
  previewBox: {
    padding: spacing['4xl'],
    borderRadius: borderRadius.xl,
    borderLeft: '4px solid',
    transition: `all ${transitions.slow}`,
  },
};

export default PreviewCard;
