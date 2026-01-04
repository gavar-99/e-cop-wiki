import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

const ActivityLogs = ({ filterUsername = null }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionFilter, filterUsername]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await window.wikiAPI.getActivityLogs({});
      setLogs(result);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by username if provided (from UserManagement)
    if (filterUsername) {
      filtered = filtered.filter((log) => log.username === filterUsername);
    }

    // Filter by search query (username or entity title)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.username.toLowerCase().includes(query) ||
          (log.entity_title && log.entity_title.toLowerCase().includes(query))
      );
    }

    // Filter by action
    if (actionFilter) {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionStyle = (action) => {
    const styles = {
      create: { bg: '#e8f5e9', color: '#2e7d32', label: 'Created' },
      edit: { bg: '#fff3e0', color: '#e65100', label: 'Edited' },
      delete: { bg: '#ffebee', color: '#c62828', label: 'Deleted' },
      restore: { bg: '#e3f2fd', color: '#1565c0', label: 'Restored' },
      login: { bg: '#f3e5f5', color: '#6a1b9a', label: 'Login' },
      logout: { bg: '#fce4ec', color: '#ad1457', label: 'Logout' },
    };
    return styles[action] || { bg: '#f5f5f5', color: '#616161', label: action };
  };

  const getActionCounts = () => {
    const counts = {};
    logs.forEach((log) => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return counts;
  };

  const actionCounts = getActionCounts();

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            {filterUsername ? `Activity Logs - ${filterUsername}` : 'Activity Logs'}
          </h3>
          <p style={subtitleStyle}>
            {filterUsername
              ? `${filteredLogs.length} activities by ${filterUsername}`
              : `${logs.length} total activities`}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={statsRowStyle}>
        {Object.entries(actionCounts).map(([action, count]) => {
          const style = getActionStyle(action);
          return (
            <div
              key={action}
              style={{
                ...statChipStyle,
                backgroundColor: style.bg,
                color: style.color,
              }}
            >
              <span style={{ fontWeight: '600' }}>{count}</span> {style.label}
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={filtersStyle}>
        <div style={searchBoxStyle}>
          <Search size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by user or entry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#666" />
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={selectStyle}>
            <option value="">All Actions</option>
            <option value="create">Created</option>
            <option value="edit">Edited</option>
            <option value="delete">Deleted</option>
            <option value="restore">Restored</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div style={tableContainerStyle}>
        {loading ? (
          <div style={emptyStateStyle}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={emptyStateStyle}>No activity logs found</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={{ ...tableHeaderStyle, width: '15%' }}>Time</th>
                <th style={{ ...tableHeaderStyle, width: '12%' }}>User</th>
                <th style={{ ...tableHeaderStyle, width: '12%' }}>Action</th>
                <th style={{ ...tableHeaderStyle, width: '10%' }}>Type</th>
                <th style={{ ...tableHeaderStyle, width: '51%' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => {
                const actionStyle = getActionStyle(log.action);
                return (
                  <tr key={log.id || index} style={tableRowStyle}>
                    <td style={tableCellStyle}>
                      <span style={timeStyle}>{formatTimestamp(log.timestamp)}</span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={userStyle}>{log.username}</span>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          ...actionBadgeStyle,
                          backgroundColor: actionStyle.bg,
                          color: actionStyle.color,
                        }}
                      >
                        {actionStyle.label}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={typeStyle}>{log.entity_type || '-'}</span>
                    </td>
                    <td style={tableCellStyle}>
                      <div>
                        {log.entity_title && (
                          <div style={entityTitleStyle}>{log.entity_title}</div>
                        )}
                        {log.details && (
                          <div style={detailsStyle}>{log.details}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: '30px',
  backgroundColor: '#fff',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const titleStyle = {
  fontFamily: "'Linux Libertine', Georgia, serif",
  fontSize: '1.8em',
  color: '#202122',
  margin: 0,
};

const subtitleStyle = {
  fontSize: '0.9em',
  color: '#72777d',
  margin: '5px 0 0 0',
};

const statsRowStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '20px',
};

const statChipStyle = {
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.85em',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
};

const filtersStyle = {
  display: 'flex',
  gap: '15px',
  marginBottom: '20px',
  alignItems: 'center',
};

const searchBoxStyle = {
  position: 'relative',
  flex: 1,
  maxWidth: '400px',
};

const searchInputStyle = {
  width: '100%',
  padding: '10px 10px 10px 40px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95em',
  outline: 'none',
};

const selectStyle = {
  padding: '10px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95em',
  backgroundColor: '#fff',
  cursor: 'pointer',
  outline: 'none',
};

const tableContainerStyle = {
  flex: 1,
  overflow: 'auto',
  border: '1px solid #e1e4e8',
  borderRadius: '4px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9em',
};

const tableHeaderRowStyle = {
  backgroundColor: '#f8f9fa',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const tableHeaderStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#202122',
  borderBottom: '2px solid #e1e4e8',
  fontSize: '0.85em',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tableRowStyle = {
  borderBottom: '1px solid #eaecf0',
  transition: 'background-color 0.1s',
};

const tableCellStyle = {
  padding: '12px 16px',
  verticalAlign: 'top',
};

const timeStyle = {
  color: '#72777d',
  fontSize: '0.9em',
};

const userStyle = {
  fontWeight: '500',
  color: '#202122',
};

const actionBadgeStyle = {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.85em',
  fontWeight: '600',
  display: 'inline-block',
};

const typeStyle = {
  color: '#54595d',
  fontSize: '0.9em',
  textTransform: 'capitalize',
};

const entityTitleStyle = {
  fontWeight: '500',
  color: '#36c',
  marginBottom: '4px',
};

const detailsStyle = {
  color: '#54595d',
  fontSize: '0.9em',
  lineHeight: '1.4',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#72777d',
  fontSize: '1em',
};

export default ActivityLogs;
