import React from 'react';
import { Sun, Moon, Check, Palette } from 'lucide-react';
import { colors, typography, spacing, borderRadius, transitions } from '../../../styles/theme';

const ACCENT_COLORS = [
  { name: 'Blue', value: '#3366cc' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Green', value: '#059669' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
];

const ThemeCard = ({ theme, accentColor, onThemeChange, onAccentChange }) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <Palette size={20} style={{ color: colors.primary }} />
        <h4 style={styles.title}>Theme</h4>
      </div>

      {/* Theme Toggle */}
      <div style={styles.themeToggle}>
        <button
          style={{
            ...styles.themeButton,
            ...(theme === 'light' ? styles.themeButtonActiveLight : {}),
          }}
          onClick={() => onThemeChange('light')}
        >
          <Sun size={24} />
          <span>Light</span>
          {theme === 'light' && <Check size={16} style={styles.checkIcon} />}
        </button>
        <button
          style={{
            ...styles.themeButton,
            ...(theme === 'dark' ? styles.themeButtonActiveDark : {}),
          }}
          onClick={() => onThemeChange('dark')}
        >
          <Moon size={24} />
          <span>Dark</span>
          {theme === 'dark' && <Check size={16} style={styles.checkIcon} />}
        </button>
      </div>

      {/* Accent Color */}
      <div style={{ marginTop: spacing['3xl'] }}>
        <label style={styles.label}>Accent Color</label>
        <div style={styles.colorGrid}>
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              style={{
                ...styles.colorSwatch,
                backgroundColor: color.value,
                ...(accentColor === color.value ? styles.colorSwatchActive : {}),
              }}
              onClick={() => onAccentChange(color.value)}
              title={color.name}
            >
              {accentColor === color.value && <Check size={16} color="#fff" />}
            </button>
          ))}
          <div style={styles.customColorContainer}>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onAccentChange(e.target.value)}
              style={styles.colorPicker}
              title="Custom color"
            />
          </div>
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
  themeToggle: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.xl,
  },
  themeButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing['3xl'],
    border: `2px solid ${colors.border}`,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.white,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    position: 'relative',
    color: colors.textSecondary,
  },
  themeButtonActiveLight: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7ff',
    color: colors.primary,
  },
  themeButtonActiveDark: {
    borderColor: '#6366f1',
    backgroundColor: '#2d2d44',
    color: colors.white,
  },
  checkIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    color: colors.primary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    display: 'block',
  },
  colorGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.xl,
    border: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `transform ${transitions.normal}, border-color ${transitions.normal}`,
  },
  colorSwatchActive: {
    borderColor: colors.text,
    transform: 'scale(1.1)',
  },
  customColorContainer: {
    position: 'relative',
  },
  colorPicker: {
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.xl,
    border: `2px dashed ${colors.borderDark}`,
    cursor: 'pointer',
    padding: 0,
  },
};

export default ThemeCard;
