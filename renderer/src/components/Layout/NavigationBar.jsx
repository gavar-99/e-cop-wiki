import React from 'react';
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRight } from 'lucide-react';
import { VIEWS, canEdit as checkCanEdit } from '../../constants';
import { colors, typography, spacing, borderRadius, transitions } from '../../styles/theme';

const NavigationBar = ({
  currentView,
  currentUser,
  onViewChange,
  onGoHome,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  showAISidebar,
  onToggleAISidebar,
}) => {
  const canEdit = checkCanEdit(currentUser?.role);

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Top Row: Logo, Nav Links, User Status */}
        <div style={styles.topRow}>
          {/* Logo and Nav Links */}
          <div style={styles.leftSection}>
            <span style={styles.logo} onClick={onGoHome}>
              E-Cop Wiki
            </span>

            {/* Navigation Links */}
            <div style={styles.navLinks}>
              <button onClick={onGoHome} style={navLinkStyle(currentView === VIEWS.DASHBOARD)}>
                Home
              </button>
              {canEdit && (
                <button
                  onClick={() => onViewChange(VIEWS.ADD)}
                  style={navLinkStyle(currentView === VIEWS.ADD)}
                >
                  Create
                </button>
              )}
            </div>
          </div>

          {/* Right Section: User Status + AI Toggle */}
          <div style={styles.rightSection}>
            {/* User Status */}
            <div style={styles.userStatus}>
              <span style={styles.onlineIndicator}></span>
              <strong>{currentUser?.username}</strong>
              {currentUser?.username?.toLowerCase() !== currentUser?.role?.toLowerCase() && (
                <>
                  <span style={{ color: colors.textLight }}>·</span>
                  <span style={roleBadgeStyle(currentUser?.role === 'admin')}>
                    {currentUser?.role}
                  </span>
                </>
              )}
            </div>

            {/* AI Sidebar Toggle */}
            <button
              onClick={onToggleAISidebar}
              title={showAISidebar ? 'Hide AI Analyst' : 'Show AI Analyst'}
              style={styles.aiToggleButton}
            >
              {showAISidebar ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
              <span style={styles.aiToggleText}>AI</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Back/Forward Navigation */}
        <div style={styles.bottomRow}>
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Go Back"
            style={historyButtonStyle(!canGoBack)}
            onMouseEnter={(e) => canGoBack && (e.target.style.color = colors.primaryDark)}
            onMouseLeave={(e) => canGoBack && (e.target.style.color = colors.primary)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Go Forward"
            style={historyButtonStyle(!canGoForward)}
            onMouseEnter={(e) => canGoForward && (e.target.style.color = colors.primaryDark)}
            onMouseLeave={(e) => canGoForward && (e.target.style.color = colors.primary)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

const navLinkStyle = (active) => ({
  background: 'none',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  cursor: 'pointer',
  padding: `${spacing.md} 5px`,
  color: active ? colors.primary : colors.textSecondary,
  fontFamily: typography.fontFamily.secondary,
  fontSize: typography.fontSize.base,
  transition: `all ${transitions.normal}`,
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '0.5px',
  fontWeight: typography.fontWeight.medium,
});

const historyButtonStyle = (disabled) => ({
  padding: `${spacing.xs} ${spacing.md}`,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: typography.fontSize.lg,
  color: disabled ? colors.borderDark : colors.primary,
  transition: `color ${transitions.fast}`,
  fontWeight: typography.fontWeight.bold,
  display: 'flex',
  alignItems: 'center',
});

const roleBadgeStyle = (isAdmin) => ({
  backgroundColor: isAdmin ? colors.primaryLight : colors.secondaryLight,
  color: isAdmin ? colors.primaryDark : colors.secondary,
  padding: `${spacing.xs} ${spacing.md}`,
  borderRadius: borderRadius.lg,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
});

const styles = {
  nav: {
    padding: `${spacing['2xl']} ${spacing['5xl']}`,
    backgroundColor: colors.white,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    zIndex: 10,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6xl'],
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xl,
  },
  logo: {
    fontFamily: 'Milker',
    fontSize: typography.fontSize['5xl'],
    color: colors.text,
    letterSpacing: '1px',
    cursor: 'pointer',
    lineHeight: 1,
  },
  navLinks: {
    display: 'flex',
    gap: spacing['3xl'],
    alignItems: 'center',
  },
  aiToggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${transitions.fast}`,
  },
  aiToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  userStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundTertiary,
    padding: `${spacing.sm} ${spacing.xl}`,
    borderRadius: borderRadius.full,
    border: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  onlineIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.circle,
    backgroundColor: colors.success,
    display: 'inline-block',
  },
  bottomRow: {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
};

export default NavigationBar;
