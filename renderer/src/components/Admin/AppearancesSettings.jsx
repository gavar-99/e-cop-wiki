import React, { useState, useEffect } from 'react';
import { Sun, Moon, Palette, Type, Layout, Eye, RotateCcw, Save, Check } from 'lucide-react';

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

  const accentColors = [
    { name: 'Blue', value: '#3366cc' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Green', value: '#059669' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Indigo', value: '#4f46e5' },
  ];

  if (!preferences) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#72777d' }}>
          Loading preferences...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={gridContainerStyle}>
        {/* Theme Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Palette size={20} style={{ color: '#36c' }} />
            <h4 style={cardTitleStyle}>Theme</h4>
          </div>

          <div style={themeToggleContainerStyle}>
            <button
              style={{
                ...themeButtonStyle,
                ...(preferences.theme === 'light' ? themeButtonActiveStyle : {}),
              }}
              onClick={() => handleChange('theme', 'light')}
            >
              <Sun size={24} />
              <span>Light</span>
              {preferences.theme === 'light' && <Check size={16} style={checkIconStyle} />}
            </button>
            <button
              style={{
                ...themeButtonStyle,
                ...(preferences.theme === 'dark' ? themeButtonActiveDarkStyle : {}),
              }}
              onClick={() => handleChange('theme', 'dark')}
            >
              <Moon size={24} />
              <span>Dark</span>
              {preferences.theme === 'dark' && <Check size={16} style={checkIconStyle} />}
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={labelStyle}>Accent Color</label>
            <div style={colorGridStyle}>
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  style={{
                    ...colorSwatchStyle,
                    backgroundColor: color.value,
                    ...(preferences.accentColor === color.value ? colorSwatchActiveStyle : {}),
                  }}
                  onClick={() => handleChange('accentColor', color.value)}
                  title={color.name}
                >
                  {preferences.accentColor === color.value && <Check size={16} color="#fff" />}
                </button>
              ))}
              <div style={customColorContainerStyle}>
                <input
                  type="color"
                  value={preferences.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  style={colorPickerStyle}
                  title="Custom color"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Type size={20} style={{ color: '#36c' }} />
            <h4 style={cardTitleStyle}>Typography</h4>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Font Family</label>
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
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Font Size</label>
            <div style={segmentedControlStyle}>
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  style={{
                    ...segmentButtonStyle,
                    ...(preferences.fontSize === size ? segmentButtonActiveStyle : {}),
                  }}
                  onClick={() => handleChange('fontSize', size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Line Height
              <span style={valueDisplayStyle}>{preferences.lineHeight}</span>
            </label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={preferences.lineHeight}
              onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value))}
              style={rangeStyle}
            />
          </div>
        </div>

        {/* Layout Card */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <Layout size={20} style={{ color: '#36c' }} />
            <h4 style={cardTitleStyle}>Layout</h4>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Sidebar Position</label>
            <div style={segmentedControlStyle}>
              {['left', 'right'].map((pos) => (
                <button
                  key={pos}
                  style={{
                    ...segmentButtonStyle,
                    ...(preferences.sidebarPosition === pos ? segmentButtonActiveStyle : {}),
                  }}
                  onClick={() => handleChange('sidebarPosition', pos)}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Content Width</label>
            <div style={segmentedControlStyle}>
              {['narrow', 'medium', 'wide'].map((width) => (
                <button
                  key={width}
                  style={{
                    ...segmentButtonStyle,
                    ...(preferences.contentWidth === width ? segmentButtonActiveStyle : {}),
                  }}
                  onClick={() => handleChange('contentWidth', width)}
                >
                  {width.charAt(0).toUpperCase() + width.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Spacing</label>
            <div style={segmentedControlStyle}>
              {['compact', 'comfortable', 'spacious'].map((spacing) => (
                <button
                  key={spacing}
                  style={{
                    ...segmentButtonStyle,
                    ...(preferences.spacing === spacing ? segmentButtonActiveStyle : {}),
                  }}
                  onClick={() => handleChange('spacing', spacing)}
                >
                  {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Default View</label>
            <div style={segmentedControlStyle}>
              <button
                style={{
                  ...segmentButtonStyle,
                  ...(preferences.defaultView === 'dashboard' ? segmentButtonActiveStyle : {}),
                }}
                onClick={() => handleChange('defaultView', 'dashboard')}
              >
                Dashboard
              </button>
              <button
                style={{
                  ...segmentButtonStyle,
                  ...(preferences.defaultView === 'lastViewed' ? segmentButtonActiveStyle : {}),
                }}
                onClick={() => handleChange('defaultView', 'lastViewed')}
              >
                Last Viewed
              </button>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <div style={cardHeaderStyle}>
            <Eye size={20} style={{ color: '#36c' }} />
            <h4 style={cardTitleStyle}>Live Preview</h4>
          </div>
          <div
            style={{
              ...previewBoxStyle,
              fontFamily:
                preferences.fontFamily === 'System' ? 'system-ui' : preferences.fontFamily,
              fontSize:
                preferences.fontSize === 'small'
                  ? '14px'
                  : preferences.fontSize === 'large'
                    ? '18px'
                    : '16px',
              lineHeight: preferences.lineHeight,
              borderLeftColor: preferences.accentColor,
              backgroundColor: preferences.theme === 'dark' ? '#1a1a2e' : '#f8f9fa',
              color: preferences.theme === 'dark' ? '#e1e4e8' : '#202122',
            }}
          >
            <h5
              style={{
                color: preferences.accentColor,
                margin: '0 0 12px 0',
                fontSize: '1.2em',
                fontWeight: '600',
              }}
            >
              Sample Wiki Article
            </h5>
            <p style={{ margin: '0 0 12px 0', opacity: 0.9 }}>
              This is how your content will look with the selected appearance settings. The quick
              brown fox jumps over the lazy dog.
            </p>
            <p style={{ margin: 0, opacity: 0.8 }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionBarStyle}>
        <button onClick={handleReset} style={resetButtonStyle}>
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          style={{
            ...saveButtonStyle,
            opacity: hasChanges ? 1 : 0.5,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
          }}
          disabled={!hasChanges}
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: '24px',
  backgroundColor: '#f5f6f8',
  minHeight: '70vh',
  fontFamily: 'Arial, sans-serif',
};

const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
  marginBottom: '24px',
};

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e8e8e8',
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f0f0f0',
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '1.1em',
  fontWeight: '600',
  color: '#202122',
};

const labelStyle = {
  fontSize: '0.9em',
  fontWeight: '600',
  color: '#54595d',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const valueDisplayStyle = {
  fontSize: '0.85em',
  fontWeight: '500',
  color: '#36c',
  backgroundColor: '#e8f0fe',
  padding: '2px 8px',
  borderRadius: '4px',
};

const fieldGroupStyle = {
  marginBottom: '20px',
};

const themeToggleContainerStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const themeButtonStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '20px',
  border: '2px solid #e1e4e8',
  borderRadius: '12px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  position: 'relative',
  color: '#54595d',
};

const themeButtonActiveStyle = {
  borderColor: '#36c',
  backgroundColor: '#f0f7ff',
  color: '#36c',
};

const themeButtonActiveDarkStyle = {
  borderColor: '#6366f1',
  backgroundColor: '#2d2d44',
  color: '#fff',
};

const checkIconStyle = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  color: '#36c',
};

const colorGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const colorSwatchStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '2px solid transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.2s, border-color 0.2s',
};

const colorSwatchActiveStyle = {
  borderColor: '#202122',
  transform: 'scale(1.1)',
};

const customColorContainerStyle = {
  position: 'relative',
};

const colorPickerStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  border: '2px dashed #ccc',
  cursor: 'pointer',
  padding: 0,
};

const selectStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.95em',
  backgroundColor: '#fff',
  cursor: 'pointer',
  outline: 'none',
};

const segmentedControlStyle = {
  display: 'flex',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  padding: '4px',
  gap: '4px',
};

const segmentButtonStyle = {
  flex: 1,
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: 'transparent',
  color: '#54595d',
  fontSize: '0.85em',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const segmentButtonActiveStyle = {
  backgroundColor: '#fff',
  color: '#36c',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const rangeStyle = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  appearance: 'none',
  backgroundColor: '#e1e4e8',
  outline: 'none',
  cursor: 'pointer',
};

const previewBoxStyle = {
  padding: '24px',
  borderRadius: '8px',
  borderLeft: '4px solid',
  transition: 'all 0.3s',
};

const actionBarStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e8e8e8',
};

const resetButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: '#fff',
  color: '#54595d',
  border: '1px solid #ddd',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.95em',
  fontWeight: '500',
  transition: 'all 0.2s',
};

const saveButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 24px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.95em',
  fontWeight: '600',
  transition: 'all 0.2s',
};

export default AppearancesSettings;
