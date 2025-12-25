import React, { useState } from 'react';

const EntryForm = ({ onComplete, initialTitle = '' }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write', 'preview', 'snapshot'
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

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

  const handleCapture = async () => {
    if (!snapshotUrl) return;
    setIsCapturing(true);
    try {
      const result = await window.wikiAPI.captureWebSnapshot(snapshotUrl);
      if (result.success) {
        setFile({ path: result.filePath, name: 'Web_Snapshot.pdf' });
        // Auto-append source to content if empty
        if (!content) setContent(`Source: ${snapshotUrl}`);
        setActiveTab('write');
        alert('Snapshot captured securely.');
      } else {
        alert('Snapshot failed: ' + result.message);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div style={{ padding: '20px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={formCardStyle}>
        <h1 style={headerStyle}>
          New Research Entry
        </h1>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #eee' }}>
          {['write', 'preview', 'snapshot'].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={tabStyle(activeTab === tab)}
             >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
             </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Entry Title</label>
            <input
                type="text"
                placeholder="Entry Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={titleInputStyle}
            />
          </div>

          {activeTab === 'write' ? (
            <div style={{ marginBottom: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label style={labelStyle}>Dossier Content (Markdown)</label>
                    <span style={{fontSize:'0.8em', color:'#666', marginBottom:'8px'}}>
                        Tip: Use <b>[[Title]]</b> to link to other entries.
                    </span>
                </div>
                <textarea
                    placeholder="Enter research data..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    style={textAreaStyle}
                />
            </div>
          ) : activeTab === 'preview' ? (
            <div style={previewBoxStyle}>
              <h1 style={{...headerStyle, fontSize: '1.8em', borderBottom: 'none'}}>{title || 'Untitled Entry'}</h1>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', lineHeight: '1.6', flex: 1, overflowY: 'auto' }}>{content || 'Nothing to preview...'}</div>
            </div>
          ) : (
            <div style={snapshotContainerStyle}>
               <h4 style={{marginTop:0, color: '#333'}}>Secure Web Archiver</h4>
               <p style={{fontSize: '0.9em', color: '#666', marginBottom: '15px'}}>
                  Enter a URL to capture a full-page PDF snapshot using a sandboxed browser process.
               </p>
               <div style={{display: 'flex', gap: '10px'}}>
                   <input 
                      type="url" 
                      placeholder="https://example.com/sensitive-report"
                      value={snapshotUrl}
                      onChange={(e) => setSnapshotUrl(e.target.value)}
                      style={{...standardInputStyle, flex: 1}}
                   />
                   <button 
                      type="button" 
                      onClick={handleCapture}
                      disabled={isCapturing}
                      style={{...actionBtnStyle, backgroundColor: isCapturing ? '#999' : '#d32f2f'}}
                   >
                      {isCapturing ? 'Archiving...' : 'Capture'}
                   </button>
               </div>
            </div>
          )}

          {/* Attachments Section */}
          <div style={attachmentSectionStyle}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                    <label style={{...labelStyle, marginBottom: '5px', display: 'block'}}>📎 Attach Evidence</label>
                    <div style={{fontSize: '0.85em', color: '#666'}}>Supported: Images, PDF</div>
                </div>
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ fontSize: '0.9em' }}
                />
            </div>
            {file && <div style={{marginTop: '10px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', color: '#1565c0', fontSize: '0.9em'}}>
                <strong>Selected:</strong> {file.name}
            </div>}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
             <button type="submit" style={primaryBtnStyle}>
                Harden & Save to Vault
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles
const formCardStyle = {
    backgroundColor: '#fff',
    border: '1px solid #a2a9b1',
    borderRadius: '2px',
    padding: '40px',
    width: '100%',
    height: '100%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column'
};

const headerStyle = {
    fontFamily: "'Linux Libertine', Georgia, serif",
    fontSize: '2.4em',
    margin: '0 0 20px 0',
    color: '#000',
    borderBottom: '1px solid #a2a9b1',
    paddingBottom: '10px',
    fontWeight: 'normal'
};

const tabStyle = (active) => ({
    padding: '10px 5px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #36c' : '3px solid transparent',
    color: active ? '#36c' : '#555',
    fontWeight: 'bold',
    fontSize: '1em',
    transition: 'all 0.2s',
    marginRight: '10px'
});

const titleInputStyle = {
    width: '100%',
    padding: '10px 0',
    fontSize: '1.5em',
    fontFamily: "'Linux Libertine', Georgia, serif",
    border: 'none',
    borderBottom: '1px solid #ccc',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#000',
    transition: 'border-color 0.2s',
};

const standardInputStyle = {
    padding: '10px',
    fontSize: '1em',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outline: 'none'
};

const textAreaStyle = {
    width: '100%',
    height: '100%',
    padding: '15px',
    fontFamily: "monospace",
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.95em',
    lineHeight: '1.5',
    resize: 'none',
    backgroundColor: '#fafafa'
};

const labelStyle = {
    display: 'block',
    fontSize: '0.85em',
    textTransform: 'uppercase',
    color: '#72777d',
    fontWeight: 'bold',
    marginBottom: '8px',
    letterSpacing: '0.5px'
};

const previewBoxStyle = {
    flex: 1,
    padding: '30px',
    border: '1px solid #eee',
    backgroundColor: '#fff',
    color: '#202122',
    display: 'flex',
    flexDirection: 'column'
};

const snapshotContainerStyle = {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e1e4e8',
    borderRadius: '6px'
};

const attachmentSectionStyle = {
    marginTop: '25px',
    padding: '20px',
    border: '1px dashed #ccc',
    borderRadius: '6px',
    backgroundColor: '#fcfcfc'
};

const primaryBtnStyle = {
    padding: '12px 24px',
    backgroundColor: '#36c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
};

const actionBtnStyle = {
    padding: '10px 20px',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
};

export default EntryForm;