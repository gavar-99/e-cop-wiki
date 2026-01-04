import React, { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo.png';

const TitleBar = ({
  transparent = false,
  userRole,
  onOpenSettings,
  onOpenAdmin,
  onOpenAbout,
  onExportDatabase,
  onImportDatabase,
  onLogout,
  onExit
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (callback) => {
    setActiveMenu(null);
    callback();
  };

  return (
    <div style={{ ...containerStyle, backgroundColor: transparent ? 'transparent' : '#fff', borderBottom: transparent ? 'none' : '1px solid #ddd' }}>
      <div style={dragRegionStyle}>
         <div style={{display: 'flex', alignItems: 'center', marginLeft: '10px', height: '100%'}}>
            <img src={logo} style={{width: '16px', marginRight: '8px', opacity: 0.8}} />
            <span style={{fontFamily: 'Segoe UI', fontSize: '12px', color: transparent ? '#fff' : '#333', marginRight: '20px'}}>E-Cop Wiki</span>

            {!transparent && (
                <div ref={menuRef} style={{display: 'flex', height: '100%', WebkitAppRegion: 'no-drag', position: 'relative'}}>
                    {/* Files Menu */}
                    <div style={{position: 'relative', height: '100%'}}>
                        <button
                            style={{...menuItemStyle, backgroundColor: activeMenu === 'files' ? '#eee' : 'transparent'}}
                            onClick={() => handleMenuClick('files')}
                        >
                            Files
                        </button>
                        {activeMenu === 'files' && (
                            <div style={dropdownStyle}>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(onLogout)}>Logout</button>
                                <div style={separatorStyle}></div>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(onExportDatabase)}>Export Database</button>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(onImportDatabase)}>Import Database</button>
                                <div style={separatorStyle}></div>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(onExit)}>Exit</button>
                            </div>
                        )}
                    </div>

                    {/* Settings Menu */}
                    <div style={{position: 'relative', height: '100%'}}>
                        <button
                            style={{...menuItemStyle, backgroundColor: activeMenu === 'settings' ? '#eee' : 'transparent'}}
                            onClick={() => handleMenuClick('settings')}
                        >
                            Settings
                        </button>
                        {activeMenu === 'settings' && (
                            <div style={dropdownStyle}>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(() => onOpenSettings('database'))}>Database</button>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(() => onOpenSettings('keywords'))}>Keywords</button>
                                <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(() => onOpenSettings('appearances'))}>Appearances</button>
                            </div>
                        )}
                    </div>

                    {/* Admin Menu (admin only) */}
                    {userRole === 'admin' && (
                        <div style={{position: 'relative', height: '100%'}}>
                            <button
                                style={{...menuItemStyle, backgroundColor: activeMenu === 'admin' ? '#eee' : 'transparent'}}
                                onClick={() => handleMenuClick('admin')}
                            >
                                Admin
                            </button>
                            {activeMenu === 'admin' && (
                                <div style={dropdownStyle}>
                                    <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(() => onOpenAdmin('users'))}>Users</button>
                                    <button style={dropdownItemStyle} onClick={() => handleMenuItemClick(() => onOpenAdmin('logs'))}>Logs</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* About Menu */}
                    <div style={{position: 'relative', height: '100%'}}>
                        <button
                            style={menuItemStyle}
                            onClick={() => handleMenuItemClick(onOpenAbout)}
                        >
                            About
                        </button>
                    </div>
                </div>
            )}
         </div>
      </div>
      <div style={controlsStyle}>
        <button onClick={() => window.wikiAPI.minimize()} style={{...btnStyle, color: transparent ? '#fff' : '#333'}}>—</button>
        <button onClick={() => window.wikiAPI.maximize()} style={{...btnStyle, color: transparent ? '#fff' : '#333'}}>☐</button>
        <button onClick={() => window.wikiAPI.close()} style={{...btnStyle, color: transparent ? '#fff' : '#333', ':hover': { backgroundColor: '#d33', color: 'white' }}}>✕</button>
      </div>
    </div>
  );
};

const containerStyle = {
  height: '32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 9999,
  userSelect: 'none',
};

const dragRegionStyle = {
  flex: 1,
  height: '100%',
  WebkitAppRegion: 'drag',
  display: 'flex',
  alignItems: 'center',
};

const controlsStyle = {
  display: 'flex',
  WebkitAppRegion: 'no-drag',
  height: '100%',
};

const btnStyle = {
  background: 'none',
  border: 'none',
  width: '46px',
  height: '100%',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '14px',
  transition: 'background 0.2s',
};

const menuItemStyle = {
    background: 'none',
    border: 'none',
    color: '#333',
    fontSize: '12px',
    padding: '0 10px',
    cursor: 'pointer',
    height: '100%',
    fontFamily: 'Segoe UI',
    transition: 'background 0.2s',
};

const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    minWidth: '150px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    padding: '5px 0'
};

const dropdownItemStyle = {
    padding: '8px 15px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#333',
    width: '100%',
    transition: 'background 0.1s',
};

const separatorStyle = {
    height: '1px',
    backgroundColor: '#eee',
    margin: '4px 0'
};

export default TitleBar;
