import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';

const FIELD_PRESETS = [
  { key: 'Born', placeholder: 'e.g., January 1, 1970' },
  { key: 'Died', placeholder: 'e.g., December 31, 2020' },
  { key: 'Nationality', placeholder: 'e.g., American' },
  { key: 'Occupation', placeholder: 'e.g., Politician, Businessman' },
  { key: 'Location', placeholder: 'e.g., New York, USA' },
  { key: 'Date', placeholder: 'e.g., June 6, 1944' },
  { key: 'Duration', placeholder: 'e.g., 6 years, 1 day' },
  { key: 'Result', placeholder: 'e.g., Allied victory' },
  { key: 'Participants', placeholder: 'e.g., USA, UK, Germany' },
  { key: 'Casualties', placeholder: 'e.g., Over 70 million' },
];

const InfoboxEditor = ({ fields, onAdd, onUpdate, onRemove }) => {
  const addPresetField = (preset) => {
    onAdd();
    // Update the newly added field with preset values
    setTimeout(() => {
      const newIndex = fields.length;
      onUpdate(newIndex, 'key', preset.key);
    }, 0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h4 style={styles.title}>Wikipedia-Style Infobox</h4>
          <p style={styles.description}>
            Add structured information that appears in a sidebar box (like Wikipedia)
          </p>
        </div>
        <button type="button" onClick={onAdd} style={styles.addButton}>
          + Add Field
        </button>
      </div>

      {/* Quick Add Presets */}
      <div style={styles.presetsSection}>
        <span style={styles.presetsLabel}>Quick add:</span>
        <div style={styles.presetButtons}>
          {FIELD_PRESETS.slice(0, 6).map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => addPresetField(preset)}
              style={styles.presetButton}
            >
              {preset.key}
            </button>
          ))}
        </div>
      </div>

      {fields.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p>No infobox fields yet.</p>
          <p style={styles.emptyHint}>
            Click "Add Field" or use quick add buttons above to create structured data that will
            appear in a Wikipedia-style sidebar.
          </p>
        </div>
      ) : (
        <div style={styles.fieldsList}>
          {/* Preview */}
          <div style={styles.previewSection}>
            <span style={styles.previewLabel}>Preview:</span>
            <div style={styles.previewBox}>
              <div style={styles.previewTitle}>Entry Title</div>
              <table style={styles.previewTable}>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={index}>
                      <th style={styles.previewTh}>{field.field_key || field.key || '...'}</th>
                      <td style={styles.previewTd}>{field.field_value || field.value || '...'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Field Editors */}
          <div style={styles.fieldsContainer}>
            {fields.map((field, index) => (
              <div key={index} style={styles.fieldRow}>
                <div style={styles.fieldNumber}>{index + 1}</div>
                <div style={styles.keyField}>
                  <label style={styles.fieldLabel}>Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Born, Location, Date"
                    value={field.field_key || field.key || ''}
                    onChange={(e) => onUpdate(index, 'key', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.valueField}>
                  <label style={styles.fieldLabel}>Value</label>
                  <input
                    type="text"
                    placeholder="e.g., January 1, 1970"
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
    marginBottom: spacing['2xl'],
  },
  title: {
    margin: 0,
    color: colors.text,
    fontSize: typography.fontSize.lg,
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
  presetsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
    flexWrap: 'wrap',
  },
  presetsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  presetButtons: {
    display: 'flex',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  presetButton: {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: '#e8f4fc',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: spacing['6xl'],
    color: colors.textLight,
    border: `1px dashed ${colors.borderLight}`,
    borderRadius: borderRadius.md,
    backgroundColor: '#fafafa',
  },
  emptyIcon: {
    fontSize: '3em',
    marginBottom: spacing.lg,
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: '1.5',
  },
  fieldsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['3xl'],
  },
  previewSection: {
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    display: 'block',
    marginBottom: spacing.md,
  },
  previewBox: {
    border: '1px solid #a2a9b1',
    backgroundColor: '#f8f9fa',
    width: '280px',
    fontSize: '0.85em',
  },
  previewTitle: {
    backgroundColor: '#cce0f5',
    padding: '8px 10px',
    textAlign: 'center',
    fontWeight: '700',
    color: '#202122',
    borderBottom: '1px solid #a2a9b1',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  previewTh: {
    padding: '5px 8px',
    backgroundColor: '#eaecf0',
    fontWeight: '600',
    textAlign: 'left',
    width: '35%',
    color: '#202122',
    borderRight: '1px solid #a2a9b1',
    borderBottom: '1px solid #a2a9b1',
    fontSize: '0.9em',
  },
  previewTd: {
    padding: '5px 8px',
    color: '#202122',
    borderBottom: '1px solid #a2a9b1',
  },
  fieldsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xl'],
  },
  fieldRow: {
    display: 'flex',
    gap: spacing.lg,
    alignItems: 'flex-end',
    padding: spacing.xl,
    backgroundColor: '#f9f9f9',
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.borderLight}`,
  },
  fieldNumber: {
    width: '28px',
    height: '28px',
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    flexShrink: 0,
  },
  keyField: {
    flex: 1,
  },
  valueField: {
    flex: 2,
  },
  fieldLabel: {
    display: 'block',
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    backgroundColor: colors.white,
  },
  removeButton: {
    padding: `${spacing.lg} ${spacing.xl}`,
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    height: '42px',
    width: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default InfoboxEditor;
