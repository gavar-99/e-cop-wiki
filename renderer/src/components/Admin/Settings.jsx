import React from 'react';
import UserManagement from './UserManagement';
import DatabaseSettings from './DatabaseSettings/index';
import ActivityLogs from './ActivityLogs';
import KeywordsManagement from './KeywordsManagement';
import AppearancesSettings from './AppearancesSettings/index';
import ProfileSettings from './ProfileSettings';

const Settings = ({ onClose, currentUser, initialTab = 'database' }) => {
  const isAdmin = currentUser?.role === 'admin';
  const activeTab = initialTab; // Fixed tab - no switching within modal

  // Get title based on active tab
  const getTitle = () => {
    const titles = {
      database: 'Database Settings',
      keywords: 'Keywords Management',
      appearances: 'Appearance Settings',
      profile: 'Profile Settings',
      users: 'User Management',
      logs: 'Logs',
      about: 'About',
    };
    return titles[activeTab] || 'Settings';
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {/* Header with close button */}
        <div style={headerStyle}>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Linux Libertine', Georgia, serif",
              fontSize: '1.8em',
            }}
          >
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f44336')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc3545')}
          >
            ×
          </button>
        </div>

        {/* Tab Content */}
        <div style={tabContentStyle}>
          {activeTab === 'database' && <DatabaseSettings />}
          {activeTab === 'keywords' && <KeywordsManagement />}
          {activeTab === 'appearances' && <AppearancesSettings currentUser={currentUser} />}
          {activeTab === 'profile' && <ProfileSettings currentUser={currentUser} />}
          {activeTab === 'users' && isAdmin && <UserManagement embedded={true} />}
          {activeTab === 'logs' && isAdmin && <ActivityLogs />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
};

// About Tab Component
const AboutTab = () => {
  return (
    <div
      style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        minHeight: '400px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Logo/Icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #3366cc 0%, #1a4ba3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(51, 102, 204, 0.3)',
        }}
      >
        <span style={{ fontSize: '2.5em', color: '#fff', fontWeight: 'bold' }}>E</span>
      </div>

      {/* App Name */}
      <h2
        style={{
          fontSize: '2em',
          fontWeight: '700',
          color: '#202122',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px',
        }}
      >
        E-Cop Wiki
      </h2>

      {/* Version Badge */}
      <div
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          backgroundColor: '#e8f0fe',
          color: '#36c',
          borderRadius: '20px',
          fontSize: '0.85em',
          fontWeight: '600',
          marginBottom: '24px',
        }}
      >
        Version 1.0.0
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '1.05em',
          color: '#54595d',
          lineHeight: '1.7',
          maxWidth: '450px',
          margin: '0 auto 30px',
        }}
      >
        Secure, anti-censorship library for Mongolian political data.
      </p>

      {/* Tech Stack */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        {['Electron', 'React', 'MongoDB', 'IPFS'].map((tech) => (
          <span
            key={tech}
            style={{
              padding: '6px 14px',
              backgroundColor: '#fff',
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
              fontSize: '0.85em',
              color: '#54595d',
              fontWeight: '500',
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Features */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          maxWidth: '500px',
          margin: '0 auto 30px',
        }}
      >
        {[
          { icon: '🔒', label: 'Secure' },
          { icon: '🌐', label: 'Decentralized' },
          { icon: '📚', label: 'Open Source' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e1e4e8',
            }}
          >
            <div style={{ fontSize: '1.5em', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ fontSize: '0.85em', color: '#54595d', fontWeight: '500' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e1e4e8',
          display: 'inline-block',
        }}
      >
        <p style={{ fontSize: '0.85em', color: '#72777d', margin: 0 }}>
          © 2024 E-Cop Team · MIT License
        </p>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalContentStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '1000px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 30px',
  borderBottom: '1px solid #e1e4e8',
};

const closeButtonStyle = {
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  width: '40px',
  height: '40px',
  fontSize: '28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  transition: 'background-color 0.2s',
};

const tabContentStyle = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#fff',
};

export default Settings;
