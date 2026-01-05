import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

const InfoboxEditor = ({ fields, onAdd, onUpdate, onRemove }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h4 style={styles.title}>Wikipedia-Style Infobox</h4>
          <p style={styles.description}>
            Add structured key-value fields (e.g., Born, Nationality, Position)
          </p>
        </div>
        <button type="button" onClick={onAdd} style={styles.addButton}>
          + Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div style={styles.emptyState}>
          No infobox fields yet. Click "Add Field" to get started.
        </div>
      ) : (
        <div style={styles.fieldsList}>
          {fields.map((field, index) => (
            <div key={index} style={styles.fieldRow}>
              <div style={styles.keyField}>
                <input
                  type="text"
                  placeholder="Field name (e.g., Born, Position)"
                  value={field.field_key || field.key || ''}
                  onChange={(e) => onUpdate(index, 'key', e.target.value)}
                  style={{ ...styles.input, fontWeight: typography.fontWeight.semibold }}
                />
              </div>
              <div style={styles.valueField}>
                <input
                  type="text"
                  placeholder="Value (e.g., January 1, 1970)"
                  value={field.field_value || field.value || ''}
                  onChange={(e) => onUpdate(index, 'value', e.target.value)}
                  style={styles.input}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                style={styles.removeButton}
                title="Remove field"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: spacing['3xl'],
    flex: 1,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    margin: 0,
    color: colors.text,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: '5px',
  },
  addButton: {
    padding: `${spacing.md} ${spacing['2xl']}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    textAlign: 'center',
    padding: spacing['6xl'],
    color: colors.textLight,
    border: `1px dashed ${colors.borderLight}`,
    borderRadius: borderRadius.md,
  },
  fieldsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xl'],
  },
  fieldRow: {
    display: 'flex',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  keyField: {
    flex: 1,
  },
  valueField: {
    flex: 2,
  },
  input: {
    width: '100%',
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: borderRadius.md,
    outline: 'none',
  },
  removeButton: {
    padding: `${spacing.lg} ${spacing.xl}`,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
  },
};

export default InfoboxEditor;
