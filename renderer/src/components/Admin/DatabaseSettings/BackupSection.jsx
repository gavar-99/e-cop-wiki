import React from 'react';
import { Download, Upload, Clock, Archive, Trash2 } from 'lucide-react';
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/theme';

// Helper functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Export/Import Cards
export const ExportImportSection = ({
  isExporting,
  isImporting,
  onExport,
  onImport,
}) => (
  <>
    <h3 style={styles.sectionTitle}>Export & Import</h3>
    <div style={styles.grid}>
      {/* Export Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Download size={20} />
          <span>Export Database</span>
        </div>
        <p style={styles.description}>
          Export all data (entries, users, tags, assets) to a single ZIP file. Can be imported on another PC.
        </p>
        <button
          onClick={onExport}
          disabled={isExporting}
          style={styles.primaryButton}
        >
          {isExporting ? 'Exporting...' : 'Export Now'}
        </button>
      </div>

      {/* Import Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Upload size={20} />
          <span>Import Database</span>
        </div>
        <p style={styles.description}>
          Import a previously exported ZIP backup. This will replace all current data. Your current database will be backed up first.
        </p>
        <button
          onClick={onImport}
          disabled={isImporting}
          style={styles.dangerButton}
        >
          {isImporting ? 'Importing...' : 'Import Backup'}
        </button>
      </div>
    </div>
  </>
);

// Backup Schedule Section
export const BackupScheduleSection = ({
  schedule,
  isBackingUp,
  onScheduleChange,
  onBackupNow,
}) => (
  <>
    <h3 style={styles.sectionTitle}>Automatic Backups</h3>
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <Clock size={20} />
        <span>Backup Schedule</span>
      </div>
      <p style={styles.description}>
        Configure automatic backup frequency. Backups are saved to your user data directory and the last 10 automatic backups are kept.
      </p>
      <div style={styles.selectWrapper}>
        <select
          value={schedule}
          onChange={(e) => onScheduleChange(e.target.value)}
          style={styles.select}
        >
          <option value="manual">Manual Only</option>
          <option value="hourly">Every Hour</option>
          <option value="daily">Daily (Recommended)</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <button
        onClick={onBackupNow}
        disabled={isBackingUp}
        style={styles.primaryButton}
      >
        {isBackingUp ? 'Creating Backup...' : 'Backup Now'}
      </button>
    </div>
  </>
);

// Backup History Section
export const BackupHistorySection = ({ backupStats, onDeleteBackup }) => (
  <div style={{ ...styles.card, marginTop: spacing['3xl'] }}>
    <div style={styles.cardHeader}>
      <Archive size={20} />
      <span>Backup History</span>
    </div>
    {backupStats && (
      <>
        <p style={styles.stats}>
          <strong>{backupStats.count}</strong> backups ({formatBytes(backupStats.totalSize)})
        </p>
        {backupStats.backups && backupStats.backups.length > 0 ? (
          <div style={styles.backupList}>
            {backupStats.backups.map((backup) => (
              <div key={backup.name} style={styles.backupItem}>
                <div style={{ flex: 1 }}>
                  <div style={styles.backupName}>
                    {backup.name}
                    {backup.isAuto && <span style={styles.autoBadge}>Auto</span>}
                  </div>
                  <div style={styles.backupMeta}>
                    {formatDate(backup.date)} · {formatBytes(backup.size)}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteBackup(backup.name)}
                  style={styles.iconButton}
                  title="Delete backup"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.emptyState}>
            No backups found. Click "Backup Now" to create one.
          </p>
        )}
      </>
    )}
  </div>
);

const styles = {
  sectionTitle: {
    fontFamily: typography.fontFamily.secondary,
    fontSize: '1.2em',
    color: colors.text,
    borderBottom: `2px solid ${colors.primary}`,
    paddingBottom: spacing.lg,
    marginBottom: spacing['3xl'],
    fontWeight: typography.fontWeight.semibold,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['3xl'],
    marginBottom: spacing['6xl'],
  },
  card: {
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    padding: spacing['3xl'],
    backgroundColor: colors.white,
    boxShadow: shadows.md,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing['2xl'],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.lg} ${spacing['3xl']}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: `background-color ${transitions.normal}`,
    width: '100%',
  },
  dangerButton: {
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.lg} ${spacing['3xl']}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: `background-color ${transitions.normal}`,
    width: '100%',
  },
  selectWrapper: {
    marginTop: spacing['2xl'],
    marginBottom: spacing['2xl'],
  },
  select: {
    width: '100%',
    padding: `${spacing.lg} ${spacing.xl}`,
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    cursor: 'pointer',
  },
  stats: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  backupList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  backupItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border}`,
  },
  backupName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  backupMeta: {
    fontSize: '0.8em',
    color: colors.textMuted,
  },
  autoBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  iconButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textMuted,
    transition: `all ${transitions.normal}`,
  },
  emptyState: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing['2xl'],
  },
};
