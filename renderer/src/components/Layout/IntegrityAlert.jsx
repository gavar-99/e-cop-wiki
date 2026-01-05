import React from 'react';
import { colors, typography, spacing } from '../../styles/theme';

const IntegrityAlert = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div style={styles.alert}>
      ⚠️ SECURITY ALERT: {issues.length} research entries have failed integrity checks.
    </div>
  );
};

const styles = {
  alert: {
    backgroundColor: colors.errorLight,
    color: colors.errorText,
    padding: spacing.lg,
    textAlign: 'center',
    borderBottom: '1px solid #ef9a9a',
    fontWeight: typography.fontWeight.bold,
  },
};

export default IntegrityAlert;
