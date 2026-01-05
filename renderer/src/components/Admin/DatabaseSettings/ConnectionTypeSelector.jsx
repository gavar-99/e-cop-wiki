import React from 'react';
import { Server, Wifi, Globe, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/theme';

const ConnectionTypeSelector = ({
  connectionType,
  localUri,
  lanUri,
  internetUri,
  testResult,
  isTesting,
  isReconnecting,
  onTypeChange,
  onUriChange,
  onTestConnection,
  onSaveAndReconnect,
}) => {
  const connectionTypes = [
    { id: 'local', label: 'Local', icon: Server },
    { id: 'lan', label: 'LAN', icon: Wifi },
    { id: 'internet', label: 'Internet', icon: Globe },
  ];

  const getUri = () => {
    switch (connectionType) {
      case 'local': return localUri;
      case 'lan': return lanUri;
      case 'internet': return internetUri;
      default: return '';
    }
  };

  const getPlaceholder = () => {
    switch (connectionType) {
      case 'local': return 'mongodb://127.0.0.1:27017/ecop-wiki';
      case 'lan': return 'mongodb://192.168.1.100:27017/ecop-wiki';
      case 'internet': return 'mongodb+srv://username:password@cluster.mongodb.net/ecop-wiki';
      default: return '';
    }
  };

  const getHint = () => {
    switch (connectionType) {
      case 'lan': return 'Enter the IP address of the MongoDB server on your local network.';
      case 'internet': return 'Use MongoDB Atlas connection string or any internet-accessible MongoDB server.';
      default: return '';
    }
  };

  const handleUriChange = (value) => {
    onUriChange(connectionType, value);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <Server size={20} />
        <span>Connection Type</span>
      </div>

      {/* Type Buttons */}
      <div style={styles.typeButtons}>
        {connectionTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTypeChange(id)}
            style={{
              ...styles.typeButton,
              backgroundColor: connectionType === id ? colors.primaryLight : '#f5f5f5',
              borderColor: connectionType === id ? colors.primaryDark : colors.borderDark,
              color: connectionType === id ? colors.primaryDark : colors.textMuted,
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* URI Input */}
      <div style={styles.uriSection}>
        <label style={styles.label}>
          {connectionType === 'local' && 'Local MongoDB URI'}
          {connectionType === 'lan' && 'LAN MongoDB URI'}
          {connectionType === 'internet' && 'MongoDB Atlas / Internet URI'}
        </label>
        <div style={styles.inputRow}>
          <input
            type="text"
            value={getUri()}
            onChange={(e) => handleUriChange(e.target.value)}
            placeholder={getPlaceholder()}
            style={styles.input}
          />
          <button
            onClick={() => onTestConnection(getUri())}
            disabled={isTesting}
            style={styles.testButton}
          >
            {isTesting ? 'Testing...' : 'Test'}
          </button>
        </div>
        {getHint() && <p style={styles.hint}>{getHint()}</p>}
      </div>

      {/* Test Result */}
      {testResult && (
        <div style={{
          ...styles.testResult,
          backgroundColor: testResult.success ? '#e8f5e9' : colors.errorLight,
          color: testResult.success ? '#2e7d32' : colors.errorText,
        }}>
          {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {testResult.message}
        </div>
      )}

      {/* Save & Connect */}
      <button
        onClick={onSaveAndReconnect}
        disabled={isReconnecting}
        style={styles.saveButton}
      >
        {isReconnecting ? (
          <span style={styles.loadingText}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Reconnecting...
          </span>
        ) : (
          'Save & Connect'
        )}
      </button>
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
    marginBottom: spacing['3xl'],
  },
  typeButtons: {
    display: 'flex',
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  typeButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing['2xl'],
    border: '2px solid',
    borderRadius: borderRadius.xl,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  uriSection: {
    marginBottom: spacing['2xl'],
  },
  label: {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputRow: {
    display: 'flex',
    gap: spacing.lg,
  },
  input: {
    flex: 1,
    padding: `${spacing.lg} ${spacing.xl}`,
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.borderDark}`,
    borderRadius: borderRadius.md,
    fontFamily: typography.fontFamily.monospace,
  },
  testButton: {
    padding: `${spacing.lg} ${spacing['3xl']}`,
    backgroundColor: '#f5f5f5',
    border: `1px solid ${colors.borderDark}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    transition: `all ${transitions.normal}`,
  },
  hint: {
    fontSize: '0.8em',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  testResult: {
    padding: `${spacing.lg} ${spacing['2xl']}`,
    borderRadius: borderRadius.md,
    marginBottom: spacing['2xl'],
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  saveButton: {
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
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
};

export default ConnectionTypeSelector;
