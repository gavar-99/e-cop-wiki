import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Camera, Shield, Calendar } from 'lucide-react';

const ProfileSettings = ({ currentUser }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changeUsername, setChangeUsername] = useState({
    newUsername: '',
    password: '',
  });
  const fileInputRef = useRef(null);

  // Load profile image from database on mount
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const result = await window.wikiAPI.getProfileImage(currentUser.username);
        if (result.success && result.profileImage) {
          setProfileImage(result.profileImage);
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfileImage();
  }, [currentUser.username]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      setProfileImage(base64Image);

      // Save to MongoDB
      try {
        const result = await window.wikiAPI.updateProfileImage({
          username: currentUser.username,
          profileImage: base64Image,
        });
        if (result.success) {
          alert('Profile picture saved successfully!');
        } else {
          alert('Error saving profile picture: ' + result.message);
        }
      } catch (error) {
        console.error('Error updating profile image:', error);
        alert('Error saving profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: { bg: '#ffebee', color: '#c62828' },
      editor: { bg: '#fff3e0', color: '#e65100' },
      reader: { bg: '#e3f2fd', color: '#1565c0' },
      viewer: { bg: '#f3e5f5', color: '#6a1b9a' },
    };
    return colors[role] || { bg: '#f5f5f5', color: '#616161' };
  };

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
      {/* Profile Header with Picture */}
      <div style={profileHeaderStyle}>
        <div style={avatarContainerStyle}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" style={avatarImageStyle} />
          ) : (
            <div style={avatarPlaceholderStyle}>{getInitials(currentUser.username)}</div>
          )}
          <button
            style={cameraButtonStyle}
            onClick={() => fileInputRef.current?.click()}
            title="Change profile picture"
          >
            <Camera size={16} color="#fff" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
        <div style={profileInfoStyle}>
          <h2 style={usernameStyle}>{currentUser.username}</h2>
          <div style={{ ...badgeStyle, ...getRoleBadgeColor(currentUser.role) }}>
            <Shield size={14} style={{ marginRight: '4px' }} />
            {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
          </div>
          <div style={joinedDateStyle}>
            <Calendar size={14} style={{ marginRight: '6px' }} />
            Member since{' '}
            {currentUser.created_at
              ? new Date(currentUser.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={columnsContainerStyle}>
        {/* Change Password Section */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>
            <Lock size={20} style={{ marginRight: '10px', color: '#36c' }} />
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
                placeholder="Min 6 characters"
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
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>
            <User size={20} style={{ marginRight: '10px', color: '#e65100' }} />
            Change Username
          </h3>
          <div style={warningBoxStyle}>
            <strong>⚠️ Warning:</strong> Changing your username will log you out.
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
                onChange={(e) => setChangeUsername({ ...changeUsername, password: e.target.value })}
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
    </div>
  );
};

// Styles
const containerStyle = {
  padding: '30px',
  backgroundColor: '#f8f9fa',
  minHeight: '70vh',
  fontFamily: 'Arial, sans-serif',
};

const profileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  marginBottom: '30px',
  padding: '30px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const avatarContainerStyle = {
  position: 'relative',
  flexShrink: 0,
};

const avatarImageStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '4px solid #e1e4e8',
};

const avatarPlaceholderStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  backgroundColor: '#36c',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2.5em',
  fontWeight: '600',
  border: '4px solid #e1e4e8',
};

const cameraButtonStyle = {
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#36c',
  border: '3px solid #fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
};

const profileInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const usernameStyle = {
  margin: 0,
  fontSize: '1.8em',
  fontWeight: '600',
  color: '#202122',
};

const joinedDateStyle = {
  display: 'flex',
  alignItems: 'center',
  color: '#72777d',
  fontSize: '0.9em',
  marginTop: '4px',
};

const columnsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '24px',
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const sectionHeaderStyle = {
  fontSize: '1.2em',
  fontWeight: '600',
  color: '#202122',
  marginBottom: '20px',
  marginTop: 0,
  display: 'flex',
  alignItems: 'center',
  paddingBottom: '12px',
  borderBottom: '2px solid #f0f0f0',
};

const labelStyle = {
  fontSize: '0.85em',
  color: '#54595d',
  marginBottom: '6px',
  fontWeight: '600',
};

const badgeStyle = {
  padding: '6px 14px',
  borderRadius: '20px',
  fontSize: '0.85em',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  width: 'fit-content',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const inputStyle = {
  padding: '12px 14px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.95em',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const primaryButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1em',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s, transform 0.1s',
  marginTop: '8px',
};

const dangerButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1em',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.2s, transform 0.1s',
  marginTop: '8px',
};

const warningBoxStyle = {
  padding: '12px 16px',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeeba',
  borderRadius: '8px',
  color: '#856404',
  marginBottom: '16px',
  fontSize: '0.9em',
};

export default ProfileSettings;
