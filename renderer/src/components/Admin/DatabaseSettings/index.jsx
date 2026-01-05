import React, { useState, useEffect } from 'react';
import ConnectionStatus from './ConnectionStatus';
import ConnectionTypeSelector from './ConnectionTypeSelector';
import { ExportImportSection, BackupScheduleSection, BackupHistorySection } from './BackupSection';
import { spacing } from '../../../styles/theme';

const DatabaseSettings = () => {
  // Export/Import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [schedule, setSchedule] = useState('daily');
  const [backupStats, setBackupStats] = useState(null);

  // MongoDB Connection state
  const [dbStatus, setDbStatus] = useState(null);
  const [connectionType, setConnectionType] = useState('local');
  const [localUri, setLocalUri] = useState('mongodb://127.0.0.1:27017/ecop-wiki');
  const [lanUri, setLanUri] = useState('mongodb://192.168.1.100:27017/ecop-wiki');
  const [internetUri, setInternetUri] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadBackupSettings();
    loadDbSettings();
  }, []);

  const loadDbSettings = async () => {
    try {
      const status = await window.wikiAPI.getDbStatus();
      setDbStatus(status);

      const config = await window.wikiAPI.getDbConfig();
      setConnectionType(config.connectionType || 'local');
      setLocalUri(config.local?.uri || 'mongodb://127.0.0.1:27017/ecop-wiki');
      setLanUri(config.lan?.uri || 'mongodb://192.168.1.100:27017/ecop-wiki');
      setInternetUri(config.internet?.uri || '');
    } catch (error) {
      console.error('Error loading DB settings:', error);
    }
  };

  const loadBackupSettings = async () => {
    try {
      const scheduleResult = await window.wikiAPI.getBackupSchedule();
      if (scheduleResult.success) {
        setSchedule(scheduleResult.schedule);
      }
      const stats = await window.wikiAPI.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup settings:', error);
    }
  };

  // Database handlers
  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const result = await window.wikiAPI.initializeDatabase();
      if (result.success) {
        if (result.created) {
          alert('Database initialized successfully!\n\nMaster admin account created:\n• Username: master\n• Password: master123\n\nPlease change the password after first login!');
        } else {
          alert('Database already initialized.\n\nMaster admin account already exists.');
        }
      } else {
        alert('Failed to initialize database:\n' + result.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleTestConnection = async (uri) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await window.wikiAPI.testDbConnection(uri);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUriChange = (type, value) => {
    switch (type) {
      case 'local': setLocalUri(value); break;
      case 'lan': setLanUri(value); break;
      case 'internet': setInternetUri(value); break;
    }
  };

  const handleSaveAndReconnect = async () => {
    setIsReconnecting(true);
    try {
      const newConfig = {
        connectionType,
        local: { uri: localUri },
        lan: { uri: lanUri },
        internet: { uri: internetUri },
      };

      const saveResult = await window.wikiAPI.updateDbConfig(newConfig);
      if (!saveResult.success) {
        alert('Failed to save config: ' + saveResult.message);
        return;
      }

      const reconnectResult = await window.wikiAPI.reconnectDb();
      if (reconnectResult.success) {
        alert('Successfully connected to ' + connectionType + ' database!');
        await loadDbSettings();
      } else {
        alert('Connection failed: ' + reconnectResult.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Export/Import handlers
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await window.wikiAPI.exportDatabase();
      if (result.success) {
        alert(`Database exported successfully!\n\nLocation: ${result.path}\n\nIncludes:\n- ${result.metadata.entryCount} entries\n- ${result.metadata.userCount} users\n- ${result.metadata.tagCount} tags\n- ${result.metadata.assetCount} assets`);
      } else {
        alert(`Export failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Export error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    const confirmed = confirm(
      'WARNING: IMPORT WILL REPLACE ALL CURRENT DATA\n\n' +
      'This will:\n' +
      '• Delete all current entries, tags, and users\n' +
      '• Replace them with data from the backup file\n' +
      '• Backup your current database first (safety)\n\n' +
      'You will need to RESTART the application after import.\n\n' +
      'Do you want to continue?'
    );

    if (!confirmed) return;

    setIsImporting(true);
    try {
      const result = await window.wikiAPI.importDatabase();
      if (result.success) {
        alert(
          'Database imported successfully!\n\n' +
          result.message + '\n\n' +
          `Your old database was backed up to:\n${result.backupLocation}\n\n` +
          'Click OK to logout. Please restart the application.'
        );
        await window.wikiAPI.logout();
      } else {
        alert(`Import failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Import error: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Backup handlers
  const handleScheduleChange = async (newSchedule) => {
    try {
      const result = await window.wikiAPI.updateBackupSchedule(newSchedule);
      if (result.success) {
        setSchedule(newSchedule);
        alert(`Backup schedule updated to: ${newSchedule.charAt(0).toUpperCase() + newSchedule.slice(1)}`);
      } else {
        alert(`Failed to update schedule: ${result.message}`);
      }
    } catch (error) {
      alert(`Error updating schedule: ${error.message}`);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const result = await window.wikiAPI.backupNow();
      if (result.success) {
        alert(`Backup created successfully!\n\nFilename: ${result.filename}`);
        loadBackupSettings();
      } else {
        alert(`Backup failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Backup error: ${error.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    const confirmed = confirm(`Delete backup: ${filename}?\n\nThis cannot be undone.`);
    if (!confirmed) return;

    try {
      const result = await window.wikiAPI.deleteBackup(filename);
      if (result.success) {
        loadBackupSettings();
      } else {
        alert(`Delete failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Delete error: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>Database Connection</h3>

      <ConnectionStatus
        dbStatus={dbStatus}
        isInitializing={isInitializing}
        onInitialize={handleInitializeDatabase}
      />

      <ConnectionTypeSelector
        connectionType={connectionType}
        localUri={localUri}
        lanUri={lanUri}
        internetUri={internetUri}
        testResult={testResult}
        isTesting={isTesting}
        isReconnecting={isReconnecting}
        onTypeChange={setConnectionType}
        onUriChange={handleUriChange}
        onTestConnection={handleTestConnection}
        onSaveAndReconnect={handleSaveAndReconnect}
      />

      <ExportImportSection
        isExporting={isExporting}
        isImporting={isImporting}
        onExport={handleExport}
        onImport={handleImport}
      />

      <BackupScheduleSection
        schedule={schedule}
        isBackingUp={isBackingUp}
        onScheduleChange={handleScheduleChange}
        onBackupNow={handleBackupNow}
      />

      <BackupHistorySection
        backupStats={backupStats}
        onDeleteBackup={handleDeleteBackup}
      />
    </div>
  );
};

const styles = {
  container: {
    padding: `${spacing['3xl']} ${spacing['5xl']}`,
    maxHeight: '600px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontFamily: 'sans-serif',
    fontSize: '1.2em',
    color: '#202122',
    borderBottom: '2px solid #36c',
    paddingBottom: spacing.lg,
    marginBottom: spacing['3xl'],
    fontWeight: '600',
  },
};

export default DatabaseSettings;
