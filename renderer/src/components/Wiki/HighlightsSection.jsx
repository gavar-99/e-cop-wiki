import React from 'react';
import { Tag } from 'lucide-react';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from '../../styles/theme';

const HighlightsSection = ({ featured, onNavigate }) => {
  if (!featured) return null;

  const getFirstParagraph = (content) => {
    if (!content) return '';
    const paragraphs = content.split('\n\n');
    const firstPara = paragraphs[0] || content;
    return firstPara.substring(0, 400) + (firstPara.length > 400 ? '...' : '');
  };

  return (
    <section style={styles.section}>
      <h2 style={styles.title}>Highlights</h2>
      <div style={styles.card}>
        <h1
          style={styles.featuredTitle}
          onClick={() => onNavigate(featured.title)}
        >
          {featured.title}
        </h1>
        {featured.tags && featured.tags.length > 0 && (
          <div style={styles.tagContainer}>
            {featured.tags.map((tag) => (
              <span key={tag} style={styles.tagBadge}>
                <Tag size={12} style={{ marginRight: spacing.xs }} /> {tag}
              </span>
            ))}
          </div>
        )}
        <p style={styles.excerpt}>{getFirstParagraph(featured.content)}</p>
        <button
          onClick={() => onNavigate(featured.title)}
          style={styles.readMoreButton}
          onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
        >
          Read Full Briefing →
        </button>
      </div>
    </section>
  );
};

const styles = {
  section: {
    marginBottom: spacing['6xl'],
    padding: spacing['4xl'],
    backgroundColor: colors.backgroundSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    boxShadow: shadows.md,
  },
  title: {
    fontFamily: typography.fontFamily.secondary,
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: spacing.lg,
    marginBottom: spacing['3xl'],
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: '0.5px',
  },
  card: {
    backgroundColor: colors.white,
    padding: spacing['3xl'],
    borderRadius: borderRadius.md,
  },
  featuredTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['3xl'],
    margin: `0 0 ${spacing.lg} 0`,
    cursor: 'pointer',
    color: colors.black,
    transition: `color ${transitions.normal}`,
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  tagBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    padding: `${spacing.xs} ${spacing.lg}`,
    borderRadius: borderRadius['2xl'],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  excerpt: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text,
    userSelect: 'text',
    cursor: 'text',
    marginBottom: spacing['2xl'],
  },
  readMoreButton: {
    color: colors.link,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    padding: 0,
    transition: `text-decoration ${transitions.normal}`,
  },
};

export default HighlightsSection;
