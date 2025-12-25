import React, { useState } from 'react';
// PM Note: Ensure you run 'npm install react-markdown' for rendering
// import ReactMarkdown from 'react-markdown';

const EntryForm = ({ onComplete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await window.wikiAPI.saveEntry({
      title,
      content,
      filePath: file ? file.path : null,
    });

    if (result.success) {
      alert('Research Locked & Hashed.');
      onComplete();
    } else {
      alert('Error: ' + result.message);
    }
  };

  return (
    <div className="wiki-form-container" style={{ maxWidth: '800px' }}>
      <h2 style={{ borderBottom: '1px solid #a2a9b1', paddingBottom: '10px' }}>
        New Political Entry
      </h2>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('write')} style={tabStyle(activeTab === 'write')}>
          Write
        </button>
        <button onClick={() => setActiveTab('preview')} style={tabStyle(activeTab === 'preview')}>
          Preview
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Entry Title (e.g., Name of Organization or Politician)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />

        {activeTab === 'write' ? (
          <textarea
            placeholder="Enter research data (Markdown supported)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={textAreaStyle}
          />
        ) : (
          <div style={previewBoxStyle}>
            <h3>{title || 'Untitled Entry'}</h3>
            <div style={{ whiteSpace: 'pre-wrap' }}>{content || 'Nothing to preview...'}</div>
          </div>
        )}

        <div
          style={{
            marginTop: '15px',
            border: '1px solid #ddd',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          <label style={{ fontSize: '0.85em', color: '#666' }}>
            📎 Attach Evidence (Screenshot/PDF):
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'block', marginTop: '5px' }}
          />
        </div>

        <button type="submit" style={saveBtnStyle}>
          Harden & Save to Vault
        </button>
      </form>
    </div>
  );
};

const tabStyle = (active) => ({
  padding: '8px 16px',
  cursor: 'pointer',
  border: '1px solid #a2a9b1',
  borderBottom: active ? 'none' : '1px solid #a2a9b1',
  backgroundColor: active ? '#fff' : '#f8f9fa',
  fontWeight: active ? 'bold' : 'normal',
});
const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '10px',
  fontSize: '1.2em',
  border: '1px solid #a2a9b1',
};
const textAreaStyle = {
  width: '100%',
  height: '300px',
  padding: '12px',
  fontFamily: 'monospace',
  border: '1px solid #a2a9b1',
};
const previewBoxStyle = {
  width: '100%',
  minHeight: '300px',
  padding: '12px',
  border: '1px solid #a2a9b1',
  backgroundColor: '#fcfcfc',
};
const saveBtnStyle = {
  marginTop: '20px',
  padding: '10px 20px',
  backgroundColor: '#36c',
  color: '#fff',
  border: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default EntryForm;
