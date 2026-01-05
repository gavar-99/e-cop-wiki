import React from 'react';
import { ENTRY_FORM_TABS } from '../../constants';
import { colors, typography, spacing, transitions } from '../../styles/theme';

const FormTabs = ({ activeTab, onTabChange }) => {
  const tabs = Object.values(ENTRY_FORM_TABS);

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={tabStyle(activeTab === tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

const tabStyle = (active) => ({
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

const styles = {
  container: {
    display: 'flex',
    gap: spacing['3xl'],
    marginBottom: spacing['4xl'],
    borderBottom: `1px solid ${colors.borderLight}`,
  },
};

export default FormTabs;
