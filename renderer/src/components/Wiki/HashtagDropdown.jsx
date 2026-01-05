import React from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

const HashtagDropdown = ({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  onMouseEnter,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      style={{
        ...styles.dropdown,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          onClick={() => onSelect(suggestion.name)}
          onMouseEnter={() => onMouseEnter(index)}
          style={{
            ...styles.item,
            backgroundColor: index === selectedIndex ? colors.primaryLight : colors.white,
          }}
        >
          <span style={styles.tagName}>#{suggestion.name}</span>
          <span style={styles.count}>
            ({suggestion.count} {suggestion.count === 1 ? 'entry' : 'entries'})
          </span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    boxShadow: shadows.xl,
    maxWidth: '300px',
    zIndex: 1000,
  },
  item: {
    padding: `${spacing.md} ${spacing.xl}`,
    cursor: 'pointer',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  tagName: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primaryDark,
  },
  count: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginLeft: spacing.md,
  },
};

export default HashtagDropdown;
