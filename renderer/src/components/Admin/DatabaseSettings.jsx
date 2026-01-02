import React, { useState, useEffect } from 'react';
import { Download, Upload, Clock, Archive, Trash2, Database, Server, Wifi, Globe, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const DatabaseSettings = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [schedule, setSchedule] = useState('daily');
  const [backupStats, setBackupStats] = useState(null);

  // MongoDB Connection State
  const [dbStatus, setDbStatus] = useState(null);
  const [dbConfig, setDbConfig] = useState(null);
  const [connectionType, setConnectionType] = useState('local');
  const [localUri, setLocalUri] = useState('mongodb://127.0.0.1:27017/ecop-wiki');
  const [lanUri, setLanUri] = useState('mongodb://192.168.1.100:27017/ecop-wiki');
  const [internetUri, setInternetUri] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadBackupSettings();
    loadDbSettings();
  }, []);

  const loadDbSettings = async () => {
    try {
      const status = await window.wikiAPI.getDbStatus();
      setDbStatus(status);

      const config = await window.wikiAPI.getDbConfig();
      setDbConfig(config);
      setConnectionType(config.connectionType || 'local');
      setLocalUri(config.local?.uri || 'mongodb://127.0.0.1:27017/ecop-wiki');
      setLanUri(config.lan?.uri || 'mongodb://192.168.1.100:27017/ecop-wiki');
      setInternetUri(config.internet?.uri || '');
    } catch (error) {
      console.error('Error loading DB settings:', error);
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

  const handleSaveAndReconnect = async () => {
    setIsReconnecting(true);
    try {
      const newConfig = {
        connectionType,
        local: { uri: localUri },
        lan: { uri: lanUri },
        internet: { uri: internetUri }
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
      '⚠️ WARNING: IMPORT WILL REPLACE ALL CURRENT DATA\n\n' +
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
          '✅ Database imported successfully!\n\n' +
          result.message + '\n\n' +
          `Your old database was backed up to:\n${result.backupLocation}\n\n` +
          'Click OK to logout. Please restart the application.'
        );
        // Logout to force restart
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
        loadBackupSettings(); // Refresh backup list
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
        loadBackupSettings(); // Refresh list
      } else {
        alert(`Delete failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Delete error: ${error.message}`);
    }
  };

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
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '20px 30px', maxHeight: '600px', overflowY: 'auto' }}>
      {/* MongoDB Connection Section */}
      <h3 style={sectionTitleStyle}>Database Connection</h3>

      {/* Connection Status */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={cardHeaderStyle}>
          <Database size={20} />
          <span>Connection Status</span>
          {dbStatus?.isConnected ? (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: '#2e7d32' }}>
              <CheckCircle size={16} /> Connected
            </span>
          ) : (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: '#c62828' }}>
              <XCircle size={16} /> Disconnected
            </span>
          )}
        </div>
        <p style={descriptionStyle}>
          Current: <strong>{dbStatus?.connectionType || 'local'}</strong> database
          {dbStatus?.connectionError && (
            <span style={{ color: '#c62828', display: 'block', marginTop: '8px' }}>
              Error: {dbStatus.connectionError}
            </span>
          )}
        </p>
      </div>

      {/* Connection Type Selection */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <div style={cardHeaderStyle}>
          <Server size={20} />
          <span>Connection Type</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setConnectionType('local')}
            style={{
              ...connectionTypeButtonStyle,
              backgroundColor: connectionType === 'local' ? '#e3f2fd' : '#f5f5f5',
              borderColor: connectionType === 'local' ? '#1565c0' : '#ccc',
              color: connectionType === 'local' ? '#1565c0' : '#666'
            }}
          >
            <Server size={18} />
            <span>Local</span>
          </button>
          <button
            onClick={() => setConnectionType('lan')}
            style={{
              ...connectionTypeButtonStyle,
              backgroundColor: connectionType === 'lan' ? '#e3f2fd' : '#f5f5f5',
              borderColor: connectionType === 'lan' ? '#1565c0' : '#ccc',
              color: connectionType === 'lan' ? '#1565c0' : '#666'
            }}
          >
            <Wifi size={18} />
            <span>LAN</span>
          </button>
          <button
            onClick={() => setConnectionType('internet')}
            style={{
              ...connectionTypeButtonStyle,
              backgroundColor: connectionType === 'internet' ? '#e3f2fd' : '#f5f5f5',
              borderColor: connectionType === 'internet' ? '#1565c0' : '#ccc',
              color: connectionType === 'internet' ? '#1565c0' : '#666'
            }}
          >
            <Globe size={18} />
            <span>Internet</span>
          </button>
        </div>

        {/* Connection URI Input */}
        {connectionType === 'local' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Local MongoDB URI</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={localUri}
                onChange={(e) => setLocalUri(e.target.value)}
                placeholder="mongodb://127.0.0.1:27017/ecop-wiki"
                style={inputStyle}
              />
              <button
                onClick={() => handleTestConnection(localUri)}
                disabled={isTesting}
                style={testButtonStyle}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>
        )}

        {connectionType === 'lan' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>LAN MongoDB URI</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={lanUri}
                onChange={(e) => setLanUri(e.target.value)}
                placeholder="mongodb://192.168.1.100:27017/ecop-wiki"
                style={inputStyle}
              />
              <button
                onClick={() => handleTestConnection(lanUri)}
                disabled={isTesting}
                style={testButtonStyle}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
              Enter the IP address of the MongoDB server on your local network.
            </p>
          </div>
        )}

        {connectionType === 'internet' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>MongoDB Atlas / Internet URI</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={internetUri}
                onChange={(e) => setInternetUri(e.target.value)}
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/ecop-wiki"
                style={inputStyle}
              />
              <button
                onClick={() => handleTestConnection(internetUri)}
                disabled={isTesting}
                style={testButtonStyle}
              >
                {isTesting ? 'Testing...' : 'Test'}
              </button>
            </div>
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
              Use MongoDB Atlas connection string or any internet-accessible MongoDB server.
            </p>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div style={{
            padding: '10px 15px',
            borderRadius: '4px',
            marginBottom: '15px',
            backgroundColor: testResult.success ? '#e8f5e9' : '#ffebee',
            color: testResult.success ? '#2e7d32' : '#c62828',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {testResult.message}
          </div>
        )}

        {/* Save and Reconnect Button */}
        <button
          onClick={handleSaveAndReconnect}
          disabled={isReconnecting}
          style={primaryButtonStyle}
        >
          {isReconnecting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Reconnecting...
            </span>
          ) : (
            'Save & Connect'
          )}
        </button>
      </div>

      {/* Export/Import Section */}
      <h3 style={sectionTitleStyle}>Export & Import</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        {/* Export Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Download size={20} />
            <span>Export Database</span>
          </div>
          <p style={descriptionStyle}>
            Export all data (entries, users, tags, assets) to a single ZIP file. Can be imported on another PC.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={primaryButtonStyle}
            onMouseEnter={(e) => !isExporting && (e.target.style.backgroundColor = '#1565c0')}
            onMouseLeave={(e) => !isExporting && (e.target.style.backgroundColor = '#36c')}
          >
            {isExporting ? 'Exporting...' : 'Export Now'}
          </button>
        </div>

        {/* Import Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Upload size={20} />
            <span>Import Database</span>
          </div>
          <p style={descriptionStyle}>
            Import a previously exported ZIP backup. This will replace all current data. Your current database will be backed up first.
          </p>
          <button
            onClick={handleImport}
            disabled={isImporting}
            style={dangerButtonStyle}
            onMouseEnter={(e) => !isImporting && (e.target.style.backgroundColor = '#c62828')}
            onMouseLeave={(e) => !isImporting && (e.target.style.backgroundColor = '#dc3545')}
          >
            {isImporting ? 'Importing...' : 'Import Backup'}
          </button>
        </div>
      </div>

      {/* Automatic Backups Section */}
      <h3 style={sectionTitleStyle}>Automatic Backups</h3>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Clock size={20} />
          <span>Backup Schedule</span>
        </div>
        <p style={descriptionStyle}>
          Configure automatic backup frequency. Backups are saved to your user data directory and the last 10 automatic backups are kept.
        </p>
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          <select
            value={schedule}
            onChange={(e) => handleScheduleChange(e.target.value)}
            style={selectStyle}
          >
            <option value="manual">Manual Only</option>
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily (Recommended)</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <button
          onClick={handleBackupNow}
          disabled={isBackingUp}
          style={primaryButtonStyle}
          onMouseEnter={(e) => !isBackingUp && (e.target.style.backgroundColor = '#1565c0')}
          onMouseLeave={(e) => !isBackingUp && (e.target.style.backgroundColor = '#36c')}
        >
          {isBackingUp ? 'Creating Backup...' : 'Backup Now'}
        </button>
      </div>

      {/* Backup History Section */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <div style={cardHeaderStyle}>
          <Archive size={20} />
          <span>Backup History</span>
        </div>
        {backupStats && (
          <>
            <p style={statsStyle}>
              <strong>{backupStats.count}</strong> backups ({formatBytes(backupStats.totalSize)})
            </p>
            {backupStats.backups && backupStats.backups.length > 0 ? (
              <div style={backupListStyle}>
                {backupStats.backups.map((backup) => (
                  <div key={backup.name} style={backupItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9em', fontWeight: '600', color: '#202122', marginBottom: '4px' }}>
                        {backup.name}
                        {backup.isAuto && <span style={autoBadgeStyle}>Auto</span>}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#72777d' }}>
                        {formatDate(backup.date)} · {formatBytes(backup.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBackup(backup.name)}
                      style={iconButtonStyle}
                      title="Delete backup"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#ffebee';
                        e.target.style.color = '#d32f2f';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#666';
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9em', color: '#72777d', fontStyle: 'italic', marginTop: '15px' }}>
                No backups found. Click "Backup Now" to create one.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Styles
const sectionTitleStyle = {
  fontFamily: 'sans-serif',
  fontSize: '1.2em',
  color: '#202122',
  borderBottom: '2px solid #36c',
  paddingBottom: '10px',
  marginBottom: '20px',
  fontWeight: '600'
};

const cardStyle = {
  border: '1px solid #e1e4e8',
  borderRadius: '4px',
  padding: '20px',
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '1.1em',
  fontWeight: '600',
  color: '#202122',
  marginBottom: '12px'
};

const descriptionStyle = {
  fontSize: '0.9em',
  color: '#54595d',
  lineHeight: '1.5',
  marginBottom: '15px'
};

const primaryButtonStyle = {
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px 20px',
  fontSize: '0.95em',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  width: '100%'
};

const dangerButtonStyle = {
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px 20px',
  fontSize: '0.95em',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  width: '100%'
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '0.95em',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer'
};

const statsStyle = {
  fontSize: '0.95em',
  color: '#202122',
  marginBottom: '15px',
  paddingBottom: '15px',
  borderBottom: '1px solid #eaecf0'
};

const backupListStyle = {
  maxHeight: '300px',
  overflowY: 'auto'
};

const backupItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  marginBottom: '8px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  border: '1px solid #e1e4e8'
};

const autoBadgeStyle = {
  marginLeft: '8px',
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '0.75em',
  fontWeight: '600'
};

const iconButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
  transition: 'all 0.2s'
};

const connectionTypeButtonStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '15px',
  border: '2px solid',
  borderRadius: '8px',
  backgroundColor: '#f5f5f5',
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontSize: '0.9em',
  fontWeight: '600'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.9em',
  fontWeight: '600',
  color: '#54595d',
  marginBottom: '8px'
};

const inputStyle = {
  flex: 1,
  padding: '10px 12px',
  fontSize: '0.9em',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'monospace'
};

const testButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  fontWeight: '600',
  color: '#333',
  transition: 'all 0.2s'
};

export default DatabaseSettings;
