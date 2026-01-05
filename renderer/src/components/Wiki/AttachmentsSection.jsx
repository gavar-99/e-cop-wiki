import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

const AttachmentsSection = ({
  existingAssets,
  newFiles,
  onFileSelect,
  onRemoveExisting,
  onRemoveNew,
  onUpdateCaption,
  onCapture, // New prop
}) => {
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureClick = async () => {
    if (!snapshotUrl) return;
    setIsCapturing(true);
    try {
      await onCapture(snapshotUrl);
      setSnapshotUrl(''); // Clear after success
    } catch (e) {
      console.error(e);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <label style={styles.label}>📎 Attach Evidence</label>
          <div style={styles.hint}>Supported: Images, PDF (multiple files allowed)</div>
        </div>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={onFileSelect}
          style={styles.fileInput}
        />
      </div>

      {/* Web Snapshot Section */}
      <div style={styles.snapshotSection}>
        <label style={styles.miniLabel}>Web Snapshot (URL)</label>
        <div style={styles.inputRow}>
          <input
            type="url"
            placeholder="https://..."
            value={snapshotUrl}
            onChange={(e) => setSnapshotUrl(e.target.value)}
            style={styles.urlInput}
          />
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={isCapturing || !snapshotUrl}
            style={{
              ...styles.captureButton,
              backgroundColor: isCapturing ? colors.textLight : colors.secondary,
              cursor: isCapturing ? 'not-allowed' : 'pointer',
            }}
          >
            {isCapturing ? 'Saving...' : 'Capture'}
          </button>
        </div>
      </div>

      {/* Existing Assets (Edit Mode) */}
      {existingAssets.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Existing Assets:</h4>
          <div style={styles.assetsList}>
            {existingAssets.map((asset) => (
              <div key={asset.id} style={styles.existingAssetRow}>
                <span style={styles.assetName}>
                  {asset.asset_path ? asset.asset_path.split(/[/\\]/).pop() : 'Untitled'}
                </span>
                <input
                  type="text"
                  placeholder="Caption..."
                  value={asset.caption || ''}
                  onChange={(e) => onUpdateCaption(asset.id, e.target.value)}
                  style={styles.captionInput}
                />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(asset.id)}
                  style={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newly Selected Files */}
      {newFiles.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>New Files:</h4>
          <div style={styles.assetsList}>
            {newFiles.map((file, index) => (
              <div key={index} style={styles.newFileRow}>
                <span style={styles.newFileName}>{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveNew(index)}
                  style={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {existingAssets.length === 0 && newFiles.length === 0 && (
        <div style={styles.emptyState}>No files attached yet</div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: spacing['3xl'],
    padding: spacing['3xl'],
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    backgroundColor: '#fafbfc',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  label: {
    display: 'block',
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
    marginBottom: '5px',
    letterSpacing: '1px',
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  fileInput: {
    fontSize: typography.fontSize.sm,
  },
  snapshotSection: {
    marginBottom: spacing['2xl'],
    padding: spacing['2xl'],
    backgroundColor: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.lg,
  },
  miniLabel: {
    display: 'block',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputRow: {
    display: 'flex',
    gap: spacing.md,
  },
  urlInput: {
    flex: 1,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  captureButton: {
    padding: `${spacing.md} ${spacing['2xl']}`,
    backgroundColor: colors.secondary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: spacing.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  assetsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  existingAssetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.borderLight}`,
  },
  assetName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  captionInput: {
    flex: 2,
    padding: spacing.md,
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
  },
  newFileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#e3f2fd',
    borderRadius: borderRadius.md,
    border: '1px solid #90caf9',
  },
  newFileName: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  removeButton: {
    padding: `${spacing.sm} ${spacing.xl}`,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    transition: 'background-color 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: spacing['3xl'],
    color: colors.textLight,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
};

export default AttachmentsSection;
