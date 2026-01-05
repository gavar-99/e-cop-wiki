import React from 'react';
import { Database, CheckCircle, XCircle } from 'lucide-react';
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/theme';

const ConnectionStatus = ({
  dbStatus,
  isInitializing,
  onInitialize,
}) => {
  const isConnected = dbStatus?.isConnected;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <Database size={20} />
        <span>Connection Status</span>
        {isConnected ? (
          <span style={styles.statusConnected}>
            <CheckCircle size={16} /> Connected
          </span>
        ) : (
          <span style={styles.statusDisconnected}>
            <XCircle size={16} /> Disconnected
          </span>
        )}
      </div>
      <p style={styles.description}>
        Current: <strong>{dbStatus?.connectionType || 'local'}</strong> database
        {dbStatus?.connectionError && (
          <span style={styles.errorText}>
            Error: {dbStatus.connectionError}
          </span>
        )}
      </p>
      <button
        onClick={onInitialize}
        disabled={isInitializing || !isConnected}
        style={{
          ...styles.initButton,
          opacity: isInitializing || !isConnected ? 0.6 : 1,
          cursor: isInitializing || !isConnected ? 'not-allowed' : 'pointer',
        }}
      >
        {isInitializing ? 'Initializing...' : 'Initialize Database'}
      </button>
      <p style={styles.hint}>
        Creates collections and master admin user (master / master123) if not exists.
      </p>
    </div>
  );
};

const styles = {
  card: {
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    padding: spacing['3xl'],
    backgroundColor: colors.white,
    boxShadow: shadows.md,
    marginBottom: spacing['3xl'],
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  statusConnected: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    color: '#2e7d32',
  },
  statusDisconnected: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    color: colors.errorText,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing['2xl'],
  },
  errorText: {
    color: colors.errorText,
    display: 'block',
    marginTop: spacing.md,
  },
  initButton: {
    backgroundColor: '#2e7d32',
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.lg} ${spacing['3xl']}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: `background-color ${transitions.normal}`,
    width: '100%',
  },
  hint: {
    fontSize: '0.8em',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
};

export default ConnectionStatus;
