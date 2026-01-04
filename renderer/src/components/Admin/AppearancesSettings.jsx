import React, { useState, useEffect } from 'react';

const AppearancesSettings = ({ currentUser }) => {
  const [preferences, setPreferences] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;
    const prefs = await window.wikiAPI.getUserPreferences(currentUser.username);
    setPreferences(prefs);
  };

  const handleChange = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences || !currentUser) return;

    const result = await window.wikiAPI.updateUserPreferences({
      username: currentUser.username,
      preferences: {
        theme: preferences.theme,
        accentColor: preferences.accentColor,
        fontFamily: preferences.fontFamily,
        fontSize: preferences.fontSize,
        lineHeight: preferences.lineHeight,
        sidebarPosition: preferences.sidebarPosition,
        defaultView: preferences.defaultView,
        contentWidth: preferences.contentWidth,
        spacing: preferences.spacing,
      },
    });

    if (result.success) {
      alert('Preferences saved! Please reload the application to apply changes.');
      setHasChanges(false);
    } else {
      alert('Failed to save preferences');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all appearance settings to defaults?')) return;

    const result = await window.wikiAPI.resetUserPreferences(currentUser.username);
    if (result.success) {
      loadPreferences();
      setHasChanges(false);
      alert('Preferences reset to defaults! Please reload the application.');
    } else {
      alert('Failed to reset preferences');
    }
  };

  if (!preferences) {
    return (
      <div style={containerStyle}>
        <p>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Theme Section */}
      <section style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Theme</h4>

        <div style={settingRowStyle}>
          <label style={labelStyle}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={preferences.theme === 'light'}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={radioStyle}
            />
            Light Mode
          </label>
          <label style={labelStyle}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={preferences.theme === 'dark'}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={radioStyle}
            />
            Dark Mode
          </label>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>
            Accent Color:
            <input
              type="color"
              value={preferences.accentColor}
              onChange={(e) => handleChange('accentColor', e.target.value)}
              style={colorInputStyle}
            />
            <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#54595d' }}>
              {preferences.accentColor}
            </span>
          </label>
        </div>
      </section>

      {/* Typography Section */}
      <section style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Typography</h4>

        <div style={settingRowStyle}>
          <label style={labelStyle}>
            Font Family:
            <select
              value={preferences.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              style={selectStyle}
            >
              <option value="Linux Libertine">Linux Libertine</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="System">System Default</option>
            </select>
          </label>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>Font Size:</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="fontSize"
                value="small"
                checked={preferences.fontSize === 'small'}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                style={radioStyle}
              />
              Small
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="fontSize"
                value="medium"
                checked={preferences.fontSize === 'medium'}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                style={radioStyle}
              />
              Medium
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="fontSize"
                value="large"
                checked={preferences.fontSize === 'large'}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                style={radioStyle}
              />
              Large
            </label>
          </div>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>
            Line Height:
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={preferences.lineHeight}
              onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value))}
              style={rangeStyle}
            />
            <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#54595d' }}>
              {preferences.lineHeight}
            </span>
          </label>
        </div>
      </section>

      {/* Layout Section */}
      <section style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Layout Preferences</h4>

        <div style={settingRowStyle}>
          <label style={labelStyle}>Sidebar Position:</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="sidebarPosition"
                value="right"
                checked={preferences.sidebarPosition === 'right'}
                onChange={(e) => handleChange('sidebarPosition', e.target.value)}
                style={radioStyle}
              />
              Right
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="sidebarPosition"
                value="left"
                checked={preferences.sidebarPosition === 'left'}
                onChange={(e) => handleChange('sidebarPosition', e.target.value)}
                style={radioStyle}
              />
              Left
            </label>
          </div>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>Default View on Startup:</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="defaultView"
                value="dashboard"
                checked={preferences.defaultView === 'dashboard'}
                onChange={(e) => handleChange('defaultView', e.target.value)}
                style={radioStyle}
              />
              Dashboard
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="defaultView"
                value="lastViewed"
                checked={preferences.defaultView === 'lastViewed'}
                onChange={(e) => handleChange('defaultView', e.target.value)}
                style={radioStyle}
              />
              Last Viewed
            </label>
          </div>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>Content Width:</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="contentWidth"
                value="narrow"
                checked={preferences.contentWidth === 'narrow'}
                onChange={(e) => handleChange('contentWidth', e.target.value)}
                style={radioStyle}
              />
              Narrow
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="contentWidth"
                value="medium"
                checked={preferences.contentWidth === 'medium'}
                onChange={(e) => handleChange('contentWidth', e.target.value)}
                style={radioStyle}
              />
              Medium
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="contentWidth"
                value="wide"
                checked={preferences.contentWidth === 'wide'}
                onChange={(e) => handleChange('contentWidth', e.target.value)}
                style={radioStyle}
              />
              Wide
            </label>
          </div>
        </div>

        <div style={settingRowStyle}>
          <label style={labelStyle}>Spacing:</label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="spacing"
                value="compact"
                checked={preferences.spacing === 'compact'}
                onChange={(e) => handleChange('spacing', e.target.value)}
                style={radioStyle}
              />
              Compact
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="spacing"
                value="comfortable"
                checked={preferences.spacing === 'comfortable'}
                onChange={(e) => handleChange('spacing', e.target.value)}
                style={radioStyle}
              />
              Comfortable
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="spacing"
                value="spacious"
                checked={preferences.spacing === 'spacious'}
                onChange={(e) => handleChange('spacing', e.target.value)}
                style={radioStyle}
              />
              Spacious
            </label>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Preview</h4>
        <div style={{
          ...previewBoxStyle,
          fontFamily: preferences.fontFamily,
          fontSize: preferences.fontSize === 'small' ? '0.9em' : preferences.fontSize === 'large' ? '1.1em' : '1em',
          lineHeight: preferences.lineHeight,
          borderColor: preferences.accentColor,
        }}>
          <h5 style={{ color: preferences.accentColor, margin: '0 0 10px 0' }}>Sample Wiki Article</h5>
          <p style={{ margin: '0 0 10px 0' }}>
            This is how your content will look with the selected appearance settings. The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{ margin: 0 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </section>

      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        <button onClick={handleReset} style={resetButtonStyle}>
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          style={{ ...saveButtonStyle, opacity: hasChanges ? 1 : 0.6 }}
          disabled={!hasChanges}
        >
          Save Settings
        </button>
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

const sectionStyle = {
  marginBottom: '30px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e1e4e8',
};

const sectionHeaderStyle = {
  fontSize: '1.2em',
  fontWeight: '600',
  color: '#36c',
  marginBottom: '15px',
};

const settingRowStyle = {
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const labelStyle = {
  fontSize: '1em',
  color: '#202122',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const radioLabelStyle = {
  fontSize: '0.95em',
  color: '#202122',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
};

const radioStyle = {
  cursor: 'pointer',
};

const selectStyle = {
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95em',
  marginLeft: '10px',
};

const colorInputStyle = {
  width: '50px',
  height: '35px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
};

const rangeStyle = {
  width: '200px',
  marginLeft: '10px',
};

const previewBoxStyle = {
  padding: '20px',
  border: '2px solid',
  borderRadius: '8px',
  backgroundColor: '#f8f9fa',
};

const actionButtonsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #e1e4e8',
};

const resetButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#f1f3f5',
  color: '#54595d',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: '500',
};

const saveButtonStyle = {
  padding: '10px 30px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: '500',
  transition: 'opacity 0.2s',
};

export default AppearancesSettings;
