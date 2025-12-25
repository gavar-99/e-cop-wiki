import React from 'react';
import logo from '../../assets/logo.png';

const TitleBar = ({ transparent = false }) => {
  return (
    <div style={{ ...containerStyle, backgroundColor: transparent ? 'transparent' : '#fff', borderBottom: transparent ? 'none' : '1px solid #ddd' }}>
      <div style={dragRegionStyle}>
         <div style={{display: 'flex', alignItems: 'center', marginLeft: '10px'}}>
            <img src={logo} style={{width: '16px', marginRight: '8px', opacity: 0.8}} />
            <span style={{fontFamily: 'Segoe UI', fontSize: '12px', color: transparent ? '#fff' : '#333'}}>E-Cop Wiki</span>
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
  WebkitAppRegion: 'drag', // Helper for Electron drag
  display: 'flex',
  alignItems: 'center',
};

const controlsStyle = {
  display: 'flex',
  WebkitAppRegion: 'no-drag', // Buttons must be clickable
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

export default TitleBar;
