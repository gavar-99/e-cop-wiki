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
        <h1 style={styles.featuredTitle} onClick={() => onNavigate(featured.title)}>
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
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  title: {
    fontFamily: typography.fontFamily.secondary,
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    borderBottom: 'none',
    paddingBottom: spacing.md,
    marginBottom: spacing['2xl'],
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: '1.5px',
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing['4xl'],
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.borderLight}`,
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
    backgroundColor: 'rgba(255, 193, 7, 0.25)',
    color: '#b8860b',
    padding: `${spacing.sm} ${spacing.xl}`,
    borderRadius: borderRadius['2xl'],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    border: '1px solid rgba(255, 193, 7, 0.4)',
  },
  excerpt: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.textSecondary,
    userSelect: 'text',
    cursor: 'text',
    marginBottom: spacing['2xl'],
  },
  readMoreButton: {
    color: colors.primary,
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
