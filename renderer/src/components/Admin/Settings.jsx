import React, { useState } from 'react';
import UserManagement from './UserManagement';
import DatabaseSettings from './DatabaseSettings';
import ActivityLogs from './ActivityLogs';

const Settings = ({ onClose, currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState('database'); // Default to database tab

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {/* Header with close button */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontFamily: "'Linux Libertine', Georgia, serif", fontSize: '1.8em' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f44336'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={tabContainerStyle}>
          <button
            onClick={() => setActiveTab('database')}
            style={tabStyle(activeTab === 'database')}
            onMouseEnter={(e) => activeTab !== 'database' && (e.target.style.borderBottom = '2px solid #90caf9')}
            onMouseLeave={(e) => activeTab !== 'database' && (e.target.style.borderBottom = '2px solid transparent')}
          >
            Database
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                style={tabStyle(activeTab === 'users')}
                onMouseEnter={(e) => activeTab !== 'users' && (e.target.style.borderBottom = '2px solid #90caf9')}
                onMouseLeave={(e) => activeTab !== 'users' && (e.target.style.borderBottom = '2px solid transparent')}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                style={tabStyle(activeTab === 'logs')}
                onMouseEnter={(e) => activeTab !== 'logs' && (e.target.style.borderBottom = '2px solid #90caf9')}
                onMouseLeave={(e) => activeTab !== 'logs' && (e.target.style.borderBottom = '2px solid transparent')}
              >
                Activity Logs
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('about')}
            style={tabStyle(activeTab === 'about')}
            onMouseEnter={(e) => activeTab !== 'about' && (e.target.style.borderBottom = '2px solid #90caf9')}
            onMouseLeave={(e) => activeTab !== 'about' && (e.target.style.borderBottom = '2px solid transparent')}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        <div style={tabContentStyle}>
          {activeTab === 'database' && <DatabaseSettings />}
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
    <div style={{ padding: '30px', textAlign: 'center' }}>
      <h3 style={{ fontFamily: "'Linux Libertine', Georgia, serif", fontSize: '1.8em', marginBottom: '20px' }}>
        E-Cop Wiki
      </h3>
      <p style={{ fontSize: '1em', color: '#54595d', marginBottom: '10px' }}>
        Version 1.0.0
      </p>
      <p style={{ fontSize: '0.95em', color: '#72777d', lineHeight: '1.6', maxWidth: '500px', margin: '20px auto' }}>
        Secure, anti-censorship library for Mongolian political data.
        <br /><br />
        Built with Electron, React, and MongoDB.
        <br />
        Powered by IPFS for decentralized storage.
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e1e4e8' }}>
        <p style={{ fontSize: '0.85em', color: '#666', margin: 0 }}>
          © 2024 E-Cop Team
          <br />
          Licensed under MIT License
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
  zIndex: 9999
};

const modalContentStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '1000px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 30px',
  borderBottom: '1px solid #e1e4e8'
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
  transition: 'background-color 0.2s'
};

const tabContainerStyle = {
  display: 'flex',
  borderBottom: '1px solid #e1e4e8',
  paddingLeft: '30px',
  backgroundColor: '#f8f9fa'
};

const tabStyle = (isActive) => ({
  padding: '15px 25px',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: isActive ? '2px solid #36c' : '2px solid transparent',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: isActive ? '600' : '500',
  color: isActive ? '#36c' : '#54595d',
  transition: 'all 0.2s',
  outline: 'none'
});

const tabContentStyle = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#fff'
};

export default Settings;
