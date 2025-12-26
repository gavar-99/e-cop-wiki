import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Trash2, Edit, UserPlus, LogIn, LogOut } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({
    username: '',
    action: '',
    entityType: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filterOptions = {};
      if (filter.username) filterOptions.username = filter.username;
      if (filter.action) filterOptions.action = filter.action;
      if (filter.entityType) filterOptions.entityType = filter.entityType;

      const result = await window.wikiAPI.getActivityLogs(filterOptions);
      setLogs(result);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await window.wikiAPI.getLogStats();
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <FileText size={16} color="#28a745" />;
      case 'edit': return <Edit size={16} color="#ffc107" />;
      case 'delete': return <Trash2 size={16} color="#dc3545" />;
      case 'restore': return <FileText size={16} color="#17a2b8" />;
      case 'login': return <LogIn size={16} color="#6c757d" />;
      case 'logout': return <LogOut size={16} color="#6c757d" />;
      default: return <Clock size={16} color="#6c757d" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return '#28a745';
      case 'edit': return '#ffc107';
      case 'delete': return '#dc3545';
      case 'restore': return '#17a2b8';
      case 'login': return '#6c757d';
      case 'logout': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '20px 30px', height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={titleStyle}>Activity Logs</h3>
        {stats && (
          <div style={{display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap'}}>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Total Activities</div>
              <div style={statValueStyle}>{stats.totalLogs.toLocaleString()}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>Active Users</div>
              <div style={statValueStyle}>{stats.uniqueUsers}</div>
            </div>
            {stats.recentActions && stats.recentActions.length > 0 && (
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Top Activity (7d)</div>
                <div style={statValueStyle}>
                  {stats.recentActions[0].action}
                  <span style={{fontSize: '0.7em', marginLeft: '5px', color: '#72777d'}}>
                    ({stats.recentActions[0].count})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={filterContainerStyle}>
        <input
          type="text"
          placeholder="Filter by username..."
          value={filter.username}
          onChange={(e) => setFilter({...filter, username: e.target.value})}
          style={filterInputStyle}
        />
        <select
          value={filter.action}
          onChange={(e) => setFilter({...filter, action: e.target.value})}
          style={filterSelectStyle}
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="edit">Edit</option>
          <option value="delete">Delete</option>
          <option value="restore">Restore</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
        <select
          value={filter.entityType}
          onChange={(e) => setFilter({...filter, entityType: e.target.value})}
          style={filterSelectStyle}
        >
          <option value="">All Types</option>
          <option value="entry">Entries</option>
          <option value="user">Users</option>
          <option value="auth">Authentication</option>
        </select>
      </div>

      {/* Logs List */}
      <div style={logsContainerStyle}>
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#72777d'}}>
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#72777d'}}>
            No activity logs found
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={logItemStyle}>
              <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                <div style={{marginTop: '2px'}}>
                  {getActionIcon(log.action)}
                </div>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                    <User size={14} color="#54595d" />
                    <span style={usernameStyle}>{log.username}</span>
                    <span style={{...actionBadgeStyle, backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action)}}>
                      {log.action}
                    </span>
                    <span style={entityTypeStyle}>{log.entity_type}</span>
                  </div>
                  {log.entity_title && (
                    <div style={entityTitleStyle}>
                      <strong>{log.entity_title}</strong>
                    </div>
                  )}
                  {log.details && (
                    <div style={detailsStyle}>{log.details}</div>
                  )}
                </div>
                <div style={timestampStyle}>
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Styles
const titleStyle = {
  fontFamily: "'Linux Libertine', Georgia, serif",
  fontSize: '1.8em',
  color: '#202122',
  marginBottom: '5px',
  fontWeight: '600'
};

const statCardStyle = {
  backgroundColor: '#f8f9fa',
  padding: '12px 16px',
  borderRadius: '4px',
  border: '1px solid #e1e4e8',
  minWidth: '140px'
};

const statLabelStyle = {
  fontSize: '0.75em',
  color: '#72777d',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '4px'
};

const statValueStyle = {
  fontSize: '1.5em',
  fontWeight: 'bold',
  color: '#202122'
};

const filterContainerStyle = {
  display: 'flex',
  gap: '10px',
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #e1e4e8'
};

const filterInputStyle = {
  flex: 1,
  padding: '8px 12px',
  fontSize: '0.9em',
  border: '1px solid #ccc',
  borderRadius: '4px',
  outline: 'none'
};

const filterSelectStyle = {
  padding: '8px 12px',
  fontSize: '0.9em',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer'
};

const logsContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#fff',
  borderRadius: '4px',
  border: '1px solid #e1e4e8'
};

const logItemStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #eaecf0',
  transition: 'background-color 0.15s',
  cursor: 'default'
};

const usernameStyle = {
  fontWeight: '600',
  color: '#202122',
  fontSize: '0.95em'
};

const actionBadgeStyle = {
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '0.75em',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const entityTypeStyle = {
  fontSize: '0.85em',
  color: '#72777d',
  fontStyle: 'italic'
};

const entityTitleStyle = {
  fontSize: '0.9em',
  color: '#0645ad',
  marginTop: '2px',
  marginBottom: '4px'
};

const detailsStyle = {
  fontSize: '0.85em',
  color: '#54595d',
  lineHeight: '1.4'
};

const timestampStyle = {
  fontSize: '0.8em',
  color: '#72777d',
  whiteSpace: 'nowrap',
  marginLeft: '8px'
};

export default ActivityLogs;
