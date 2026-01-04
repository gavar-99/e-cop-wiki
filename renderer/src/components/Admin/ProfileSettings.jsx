import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

const ProfileSettings = ({ currentUser }) => {
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changeUsername, setChangeUsername] = useState({
    newUsername: '',
    password: '',
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (changePassword.newPassword !== changePassword.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (changePassword.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    const result = await window.wikiAPI.changeOwnPassword({
      currentPassword: changePassword.currentPassword,
      newPassword: changePassword.newPassword,
    });

    if (result.success) {
      alert('Password changed successfully');
      setChangePassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      alert('Error changing password: ' + result.message);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();

    if (!changeUsername.newUsername.trim()) {
      alert('Username cannot be empty');
      return;
    }

    if (changeUsername.newUsername === currentUser.username) {
      alert('New username must be different from current username');
      return;
    }

    const result = await window.wikiAPI.changeOwnUsername({
      newUsername: changeUsername.newUsername.trim(),
      password: changeUsername.password,
    });

    if (result.success) {
      alert('Username changed successfully. Please log in again with your new username.');
      window.location.reload();
    } else {
      alert('Error changing username: ' + result.message);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Current User Info */}
      <div style={infoSectionStyle}>
        <h3 style={sectionHeaderStyle}>Current Profile</h3>
        <div style={infoItemStyle}>
          <User size={18} color="#54595d" />
          <div>
            <div style={labelStyle}>Username</div>
            <div style={valueStyle}>{currentUser.username}</div>
          </div>
        </div>
        <div style={infoItemStyle}>
          <div style={badgeStyle}>
            {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div style={sectionStyle}>
        <h3 style={sectionHeaderStyle}>
          <Lock size={20} style={{ marginRight: '8px' }} />
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={changePassword.currentPassword}
              onChange={(e) =>
                setChangePassword({ ...changePassword, currentPassword: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="Enter current password"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={changePassword.newPassword}
              onChange={(e) =>
                setChangePassword({ ...changePassword, newPassword: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={changePassword.confirmPassword}
              onChange={(e) =>
                setChangePassword({ ...changePassword, confirmPassword: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="Re-enter new password"
            />
          </div>
          <button type="submit" style={primaryButtonStyle}>
            Update Password
          </button>
        </form>
      </div>

      {/* Change Username Section */}
      <div style={sectionStyle}>
        <h3 style={sectionHeaderStyle}>
          <User size={20} style={{ marginRight: '8px' }} />
          Change Username
        </h3>
        <div style={warningBoxStyle}>
          <strong>Warning:</strong> Changing your username will log you out. You will need to log
          in again with your new username.
        </div>
        <form onSubmit={handleUsernameChange} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>New Username</label>
            <input
              type="text"
              value={changeUsername.newUsername}
              onChange={(e) =>
                setChangeUsername({ ...changeUsername, newUsername: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="Enter new username"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Confirm with Password</label>
            <input
              type="password"
              value={changeUsername.password}
              onChange={(e) =>
                setChangeUsername({ ...changeUsername, password: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="Enter your current password"
            />
          </div>
          <button type="submit" style={dangerButtonStyle}>
            Change Username
          </button>
        </form>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: '30px',
  backgroundColor: '#fff',
  maxHeight: '70vh',
  overflowY: 'auto',
};

const infoSectionStyle = {
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  border: '1px solid #e1e4e8',
};

const sectionStyle = {
  marginBottom: '30px',
  paddingBottom: '30px',
  borderBottom: '1px solid #e1e4e8',
};

const sectionHeaderStyle = {
  fontSize: '1.2em',
  fontWeight: '600',
  color: '#202122',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
};

const infoItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '15px',
};

const labelStyle = {
  fontSize: '0.85em',
  color: '#72777d',
  marginBottom: '5px',
  fontWeight: '500',
};

const valueStyle = {
  fontSize: '1.1em',
  color: '#202122',
  fontWeight: '600',
};

const badgeStyle = {
  padding: '6px 14px',
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  borderRadius: '16px',
  fontSize: '0.9em',
  fontWeight: '600',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  maxWidth: '500px',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95em',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const primaryButtonStyle = {
  padding: '10px 24px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1em',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  alignSelf: 'flex-start',
};

const dangerButtonStyle = {
  padding: '10px 24px',
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1em',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  alignSelf: 'flex-start',
};

const warningBoxStyle = {
  padding: '12px 16px',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '4px',
  color: '#856404',
  marginBottom: '20px',
  fontSize: '0.9em',
};

export default ProfileSettings;
