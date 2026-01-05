import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

const WebSnapshotTab = ({ onCapture }) => {
  const [url, setUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = async () => {
    if (!url) return;
    setIsCapturing(true);
    try {
      await onCapture(url);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Secure Web Archiver</h4>
      <p style={styles.description}>
        Enter a URL to capture a full-page PDF snapshot using a sandboxed browser process.
      </p>
      <div style={styles.inputRow}>
        <input
          type="url"
          placeholder="https://example.com/sensitive-report"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.input}
        />
        <button
          type="button"
          onClick={handleCapture}
          disabled={isCapturing || !url}
          style={{
            ...styles.captureButton,
            backgroundColor: isCapturing ? colors.textLight : colors.error,
            cursor: isCapturing ? 'not-allowed' : 'pointer',
          }}
        >
          {isCapturing ? 'Archiving...' : 'Capture'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: spacing['3xl'],
    backgroundColor: colors.backgroundSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
  },
  title: {
    marginTop: 0,
    color: colors.text,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing['2xl'],
  },
  inputRow: {
    display: 'flex',
    gap: spacing.lg,
  },
  input: {
    flex: 1,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: borderRadius.md,
    outline: 'none',
  },
  captureButton: {
    padding: `${spacing.lg} ${spacing['3xl']}`,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.bold,
  },
};

export default WebSnapshotTab;
