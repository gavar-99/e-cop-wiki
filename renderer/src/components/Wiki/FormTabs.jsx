import React from 'react';
import { ENTRY_FORM_TABS } from '../../constants';
import { colors, typography, spacing, transitions, borderRadius } from '../../styles/theme';

const FormTabs = ({ activeTab, onTabChange }) => {
  const tabs = Object.values(ENTRY_FORM_TABS);

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button key={tab} onClick={() => onTabChange(tab)} style={tabStyle(activeTab === tab)}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

const tabStyle = (active) => ({
  padding: `${spacing.lg} ${spacing.xl}`,
  cursor: 'pointer',
  background: active ? colors.primaryLight : 'transparent',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  color: active ? colors.primary : colors.textMuted,
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.sm,
  transition: `all ${transitions.normal}`,
  marginRight: spacing.sm,
  borderRadius: `${borderRadius.md} ${borderRadius.md} 0 0`,
});

const styles = {
  container: {
    display: 'flex',
    gap: spacing.xs,
    marginBottom: spacing['3xl'],
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 0,
  },
};

export default FormTabs;
