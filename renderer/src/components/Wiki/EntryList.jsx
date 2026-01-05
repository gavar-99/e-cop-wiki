import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from '../../styles/theme';

const EntryList = ({
  entries,
  onNavigate,
  title,
  icon: Icon,
  showDate = true,
  showTags = true,
  maxTags = 3,
  dateLabel = null,
  excerptLength = 120,
}) => {
  return (
    <section style={styles.sectionCard}>
      <h3 style={styles.sectionHeader}>
        <Icon size={18} style={{ marginRight: spacing.md }} /> {title}
      </h3>
      {dateLabel && <p style={styles.dateLabel}>{dateLabel}</p>}
      <ul style={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id} style={styles.listItem}>
            <a
              href="#"
              onClick={(evt) => {
                evt.preventDefault();
                onNavigate(entry.title);
              }}
              style={styles.link}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              {entry.title}
            </a>
            {showDate && entry.timestamp && (
              <div style={styles.meta}>
                {new Date(entry.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            )}
            <div style={styles.excerpt}>
              {entry.content ? entry.content.substring(0, excerptLength) + '...' : ''}
            </div>
            {showTags && entry.tags && entry.tags.length > 0 && (
              <div style={styles.tagContainer}>
                {entry.tags.slice(0, maxTags).map((tag) => (
                  <span key={tag} style={styles.tagBadge}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

// Specialized components using EntryList

export const LatestEntries = ({ entries, onNavigate }) => (
  <EntryList
    entries={entries}
    onNavigate={onNavigate}
    title="Latest"
    icon={Clock}
    showDate={true}
    showTags={true}
  />
);

export const OnThisDay = ({ entries, onNavigate }) => {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <EntryList
      entries={entries}
      onNavigate={onNavigate}
      title="On This Day"
      icon={Calendar}
      showDate={false}
      showTags={false}
      dateLabel={dateLabel}
      excerptLength={100}
    />
  );
};

const styles = {
  sectionCard: {
    border: `1px solid ${colors.border}`,
    padding: spacing['3xl'],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    minHeight: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  sectionHeader: {
    fontFamily: typography.fontFamily.secondary,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingBottom: spacing.lg,
    marginBottom: spacing['3xl'],
    fontWeight: typography.fontWeight.semibold,
    display: 'flex',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing['2xl'],
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  link: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textDecoration: 'none',
    fontFamily: typography.fontFamily.primary,
    cursor: 'pointer',
    transition: `text-decoration ${transitions.normal}`,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  excerpt: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: typography.lineHeight.snug,
    userSelect: 'text',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    color: '#b8860b',
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
};

export default EntryList;
