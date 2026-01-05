import React, { useState, useEffect } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import ThemeCard from './ThemeCard';
import TypographyCard from './TypographyCard';
import LayoutCard from './LayoutCard';
import PreviewCard from './PreviewCard';
import { colors, typography, spacing, borderRadius, transitions } from '../../../styles/theme';

const AppearancesSettings = ({ currentUser }) => {
  const [preferences, setPreferences] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;
    const prefs = await window.wikiAPI.getUserPreferences(currentUser.username);
    setPreferences(prefs);
  };

  const handleChange = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences || !currentUser) return;

    const result = await window.wikiAPI.updateUserPreferences({
      username: currentUser.username,
      preferences: {
        theme: preferences.theme,
        accentColor: preferences.accentColor,
        fontFamily: preferences.fontFamily,
        fontSize: preferences.fontSize,
        lineHeight: preferences.lineHeight,
        sidebarPosition: preferences.sidebarPosition,
        defaultView: preferences.defaultView,
        contentWidth: preferences.contentWidth,
        spacing: preferences.spacing,
      },
    });

    if (result.success) {
      alert('Preferences saved! Please reload the application to apply changes.');
      setHasChanges(false);
    } else {
      alert('Failed to save preferences');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all appearance settings to defaults?')) return;

    const result = await window.wikiAPI.resetUserPreferences(currentUser.username);
    if (result.success) {
      loadPreferences();
      setHasChanges(false);
      alert('Preferences reset to defaults! Please reload the application.');
    } else {
      alert('Failed to reset preferences');
    }
  };

  if (!preferences) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading preferences...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <ThemeCard
          theme={preferences.theme}
          accentColor={preferences.accentColor}
          onThemeChange={(value) => handleChange('theme', value)}
          onAccentChange={(value) => handleChange('accentColor', value)}
        />

        <TypographyCard
          fontFamily={preferences.fontFamily}
          fontSize={preferences.fontSize}
          lineHeight={preferences.lineHeight}
          onFontFamilyChange={(value) => handleChange('fontFamily', value)}
          onFontSizeChange={(value) => handleChange('fontSize', value)}
          onLineHeightChange={(value) => handleChange('lineHeight', value)}
        />

        <LayoutCard
          sidebarPosition={preferences.sidebarPosition}
          contentWidth={preferences.contentWidth}
          spacingOption={preferences.spacing}
          defaultView={preferences.defaultView}
          onSidebarPositionChange={(value) => handleChange('sidebarPosition', value)}
          onContentWidthChange={(value) => handleChange('contentWidth', value)}
          onSpacingChange={(value) => handleChange('spacing', value)}
          onDefaultViewChange={(value) => handleChange('defaultView', value)}
        />

        <PreviewCard preferences={preferences} />
      </div>

      {/* Action Buttons */}
      <div style={styles.actionBar}>
        <button onClick={handleReset} style={styles.resetButton}>
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          style={{
            ...styles.saveButton,
            opacity: hasChanges ? 1 : 0.5,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
          }}
          disabled={!hasChanges}
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: spacing['4xl'],
    backgroundColor: '#f5f6f8',
    minHeight: '70vh',
    fontFamily: typography.fontFamily.secondary,
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: colors.textMuted,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing['3xl'],
    marginBottom: spacing['4xl'],
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing['2xl']} ${spacing['3xl']}`,
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: `1px solid #e8e8e8`,
  },
  resetButton: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing['3xl']}`,
    backgroundColor: colors.white,
    color: colors.textSecondary,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.xl,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.lg} ${spacing['4xl']}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.xl,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${transitions.normal}`,
  },
};

export default AppearancesSettings;
