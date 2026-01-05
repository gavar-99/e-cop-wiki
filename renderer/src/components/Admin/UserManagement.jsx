import React, { useState, useEffect } from 'react';
import ActivityLogs from './ActivityLogs';

const UserManagement = ({ onClose, embedded = false }) => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
  const [showLogsFor, setShowLogsFor] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await window.wikiAPI.getUsers();
      if (Array.isArray(result)) {
        setUsers(result);
      } else if (result.success === false) {
        alert('Error loading users: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const result = await window.wikiAPI.createUser(newUser);
    if (result.success) {
      alert('User created successfully');
      setNewUser({ username: '', password: '', role: 'viewer' });
      loadUsers();
    } else {
      alert('Error creating user: ' + result.message);
    }
  };

  const handleDeleteUser = async (username) => {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      const result = await window.wikiAPI.deleteUser(username);
      if (result.success) {
        loadUsers();
      } else {
        alert('Error deleting user: ' + result.message);
      }
    }
  };

  const handleRoleChange = async (username, newRole) => {
    const result = await window.wikiAPI.updateUserRole({ username, role: newRole });
    if (result.success) {
      loadUsers();
    } else {
      alert('Error updating role: ' + result.message);
    }
  };

  const handleToggleActive = async (username) => {
    const result = await window.wikiAPI.toggleUserActive(username);
    if (result.success) {
      loadUsers();
    } else {
      alert('Error toggling user status: ' + result.message);
    }
  };

  const handleResetPassword = async (username) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    const result = await window.wikiAPI.resetUserPassword({ username, newPassword });
    if (result.success) {
      alert('Password reset successfully');
    } else {
      alert('Error resetting password: ' + result.message);
    }
  };

  const content = (
    <div style={embedded ? {} : modalContentStyle}>
      {!embedded && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0 }}>User Management</h2>
          <button onClick={onClose} style={closeBtnStyle}>
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Create User Form */}
        <div style={{ flex: 1, padding: '25px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.2em' }}>Create New User</h3>
          <form
            onSubmit={handleCreateUser}
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
              style={inputStyle}
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              style={inputStyle}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={primaryBtnStyle}>
              Create User
            </button>
          </form>
        </div>

        {/* User List */}
        <div style={{ flex: 2, height: '500px', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.2em' }}>User List</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Logs</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Reset Password</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Toggle Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.username}
                  style={{ borderBottom: '1px solid #eee', opacity: user.active === 0 ? 0.5 : 1 }}
                >
                  <td style={tdStyle}>
                    {user.username}
                    {user.active === 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '0.75em', color: '#999' }}>
                        (Deactivated)
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.username, e.target.value)}
                      style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.9em' }}
                      disabled={user.active === 0}
                    >
                      <option value="reader">Reader</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8em',
                        backgroundColor: user.active === 1 ? '#e8f5e9' : '#ffebee',
                        color: user.active === 1 ? '#2e7d32' : '#c62828',
                        fontWeight: '500',
                      }}
                    >
                      {user.active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.85em', color: '#666' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => setShowLogsFor(user.username)} style={blueBtnStyle}>
                      View
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleResetPassword(user.username)} style={blueBtnStyle}>
                      Reset
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleToggleActive(user.username)} style={blueBtnStyle}>
                      {user.active === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleDeleteUser(user.username)} style={redBtnStyle}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Return content wrapped in modal overlay if not embedded
  return (
    <>
      {embedded ? content : <div style={modalOverlayStyle}>{content}</div>}

      {/* User Logs Modal */}
      {showLogsFor && (
        <div style={logsModalOverlayStyle}>
          <div style={logsModalContentStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0 }}>Лог</h2>
              <button onClick={() => setShowLogsFor(null)} style={closeBtnStyle}>
                ✕
              </button>
            </div>
            <ActivityLogs filterUsername={showLogsFor} />
          </div>
        </div>
      )}
    </>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  width: '1400px',
  maxWidth: '95%',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.2em',
  cursor: 'pointer',
  color: '#666',
};

const inputStyle = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '0.95em',
};

const primaryBtnStyle = {
  padding: '10px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const blueBtnStyle = {
  padding: '6px 12px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85em',
  fontWeight: '500',
  transition: 'background-color 0.2s',
};

const redBtnStyle = {
  padding: '6px 12px',
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85em',
  fontWeight: '500',
  transition: 'background-color 0.2s',
};

const thStyle = {
  padding: '10px',
  color: '#555',
  fontSize: '0.9em',
};

const tdStyle = {
  padding: '10px',
  color: '#333',
};

const logsModalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,
};

const logsModalContentStyle = {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '1200px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
};

export default UserManagement;
