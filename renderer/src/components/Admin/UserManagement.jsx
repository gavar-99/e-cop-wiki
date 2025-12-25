import React, { useState, useEffect } from 'react';

const UserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });

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

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{margin: 0}}>User Management</h2>
            <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{display: 'flex', gap: '20px'}}>
            {/* Create User Form */}
            <div style={{flex: 1, padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                <h3 style={{marginTop: 0, fontSize: '1.1em'}}>Create New User</h3>
                <form onSubmit={handleCreateUser} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={newUser.username} 
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        required
                        style={inputStyle}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={newUser.password} 
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        required
                        style={inputStyle}
                    />
                    <select 
                        value={newUser.role} 
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        style={inputStyle}
                    >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" style={primaryBtnStyle}>Create User</button>
                </form>
            </div>

            {/* User List */}
            <div style={{flex: 2, height: '400px', overflowY: 'auto'}}>
                <h3 style={{marginTop: 0, fontSize: '1.1em'}}>Existing Users</h3>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                        <tr style={{textAlign: 'left', borderBottom: '2px solid #ddd'}}>
                            <th style={thStyle}>Username</th>
                            <th style={thStyle}>Role</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Created</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.username} style={{borderBottom: '1px solid #eee', opacity: user.active === 0 ? 0.5 : 1}}>
                                <td style={tdStyle}>
                                    {user.username}
                                    {user.active === 0 && <span style={{marginLeft: '8px', fontSize: '0.75em', color: '#999'}}>(Deactivated)</span>}
                                </td>
                                <td style={tdStyle}>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.username, e.target.value)}
                                        style={{...inputStyle, padding: '4px'}}
                                        disabled={user.active === 0}
                                    >
                                        <option value="reader">Reader</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8em',
                                        backgroundColor: user.active === 1 ? '#e8f5e9' : '#ffebee',
                                        color: user.active === 1 ? '#2e7d32' : '#c62828',
                                        fontWeight: '500'
                                    }}>
                                        {user.active === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{fontSize: '0.85em', color: '#666'}}>
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <button
                                            onClick={() => handleToggleActive(user.username)}
                                            style={{
                                                ...actionBtnStyle,
                                                backgroundColor: user.active === 1 ? '#fff3e0' : '#e3f2fd',
                                                color: user.active === 1 ? '#e65100' : '#1565c0',
                                                border: `1px solid ${user.active === 1 ? '#ffcc80' : '#90caf9'}`
                                            }}
                                        >
                                            {user.active === 1 ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.username)}
                                            style={deleteBtnStyle}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
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
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    width: '900px',
    maxWidth: '90%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const closeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.2em',
    cursor: 'pointer',
    color: '#666'
};

const inputStyle = {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.95em'
};

const primaryBtnStyle = {
    padding: '10px',
    backgroundColor: '#36c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const deleteBtnStyle = {
    padding: '4px 8px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em'
};

const thStyle = {
    padding: '10px',
    color: '#555'
};

const tdStyle = {
    padding: '10px',
    color: '#333'
};

const actionBtnStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em',
    fontWeight: '500'
};

export default UserManagement;