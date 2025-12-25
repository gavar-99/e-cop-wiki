import React, { useState, useRef, useEffect } from 'react';
import TagInput from './TagInput';

const EntryForm = ({ onComplete, initialTitle = '' }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('write'); // 'write', 'preview', 'snapshot'
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Hashtag autocomplete state
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagPosition, setHashtagPosition] = useState({ top: 0, left: 0 });
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0);
  const [allTags, setAllTags] = useState([]);
  const textareaRef = useRef(null);

  // Load existing tags for autocomplete
  useEffect(() => {
    const loadTags = async () => {
      const tagList = await window.wikiAPI.getAllTags();
      setAllTags(tagList);
    };
    loadTags();
  }, []);

  // Detect hashtag as user types and show suggestions
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPos);

    // Check if user is typing a hashtag
    const hashtagMatch = textBeforeCursor.match(/#([\w_]*)$/);

    if (hashtagMatch) {
      const query = hashtagMatch[1];
      setHashtagQuery(query);

      // Filter tags that match the query
      const filtered = allTags
        .filter(t => t.name.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5);

      setHashtagSuggestions(filtered);
      setShowHashtagSuggestions(filtered.length > 0);
      setSelectedHashtagIndex(0);

      // Calculate position for dropdown (approximate)
      const textarea = textareaRef.current;
      if (textarea) {
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const lineHeight = 20; // approximate
        setHashtagPosition({
          top: currentLine * lineHeight,
          left: 20
        });
      }
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  // Handle keyboard events in textarea
  const handleTextareaKeyDown = (e) => {
    if (showHashtagSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHashtagIndex(prev => Math.min(prev + 1, hashtagSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHashtagIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && hashtagSuggestions.length > 0) {
        e.preventDefault();
        insertHashtag(hashtagSuggestions[selectedHashtagIndex].name);
      } else if (e.key === 'Escape') {
        setShowHashtagSuggestions(false);
      }
    }
  };

  // Insert selected hashtag
  const insertHashtag = (tagName) => {
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);

    // Find the # position
    const hashPos = textBefore.lastIndexOf('#');
    // Replace spaces with underscores for hashtag format in content
    const hashtagFormat = tagName.replace(/ /g, '_');
    const newContent = textBefore.substring(0, hashPos + 1) + hashtagFormat + textAfter;

    setContent(newContent);
    setShowHashtagSuggestions(false);

    // Set cursor position after the inserted tag
    setTimeout(() => {
      const newPos = hashPos + 1 + hashtagFormat.length;
      textareaRef.current.selectionStart = newPos;
      textareaRef.current.selectionEnd = newPos;
      textareaRef.current.focus();
    }, 0);
  };

  // Manual hashtag extraction function
  const scanHashtags = () => {
    // Match hashtags (supports underscores for multi-word tags like #Joe_Biden)
    // Matches #word or #word_word followed by whitespace, punctuation, or end of string
    const hashtagRegex = /#([\w_]+)(?=\s|$|[^\w_])/g;
    const matches = [...content.matchAll(hashtagRegex)];

    // Clean tags: remove # and replace underscores with spaces
    const extractedTags = matches.map(match => match[1].replace(/_/g, ' '));

    // Add extracted tags that aren't already in the tags list
    let newTagsCount = 0;
    extractedTags.forEach(tag => {
      if (!tags.includes(tag)) {
        setTags(prev => [...prev, tag]);
        newTagsCount++;
      }
    });

    if (newTagsCount > 0) {
      alert(`✅ Found ${newTagsCount} new hashtag(s) in your content!`);
    } else if (extractedTags.length > 0) {
      alert('ℹ️ All hashtags are already in your tags list.');
    } else {
      alert('ℹ️ No hashtags found in content.\n\nTip: Use #hashtag or #Multi_Word_Tag format.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await window.wikiAPI.saveEntry({
      title,
      content,
      filePath: file ? file.path : null,
      tags,
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

          {/* Tag Input Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={labelStyle}>Tags / Keywords</label>
              <button
                type="button"
                onClick={scanHashtags}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#36c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2558a8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#36c'}
              >
                🔍 Scan Tags from Content
              </button>
            </div>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {activeTab === 'write' ? (
            <div style={{ marginBottom: '20px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label style={labelStyle}>Dossier Content (Markdown)</label>
                    <span style={{fontSize:'0.8em', color:'#666', marginBottom:'8px'}}>
                        Tip: Use <b>[[Title]]</b> to link. Type <b>#</b> for tag suggestions.
                    </span>
                </div>
                <textarea
                    ref={textareaRef}
                    placeholder="Enter research data..."
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleTextareaKeyDown}
                    required
                    style={textAreaStyle}
                />
                {/* Hashtag autocomplete dropdown */}
                {showHashtagSuggestions && (
                  <div style={{
                    position: 'absolute',
                    top: `${hashtagPosition.top + 80}px`,
                    left: `${hashtagPosition.left}px`,
                    backgroundColor: '#fff',
                    border: '1px solid #e1e4e8',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    maxWidth: '300px',
                    zIndex: 1000
                  }}>
                    {hashtagSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        onClick={() => insertHashtag(suggestion.name)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          backgroundColor: index === selectedHashtagIndex ? '#e3f2fd' : '#fff',
                          borderBottom: index < hashtagSuggestions.length - 1 ? '1px solid #eee' : 'none'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', color: '#1565c0' }}>#{suggestion.name}</span>
                        <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                          ({suggestion.count} {suggestion.count === 1 ? 'entry' : 'entries'})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ) : activeTab === 'preview' ? (
            <div style={previewBoxStyle}>
              <h1 style={{...headerStyle, fontSize: '1.8em', borderBottom: 'none'}}>{title || 'Untitled Entry'}</h1>
              {/* Preview tags */}
              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  {tags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      backgroundColor: '#e3f2fd',
                      color: '#1565c0',
                      borderRadius: '16px',
                      fontSize: '0.85em',
                      fontWeight: '500'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
    flexDirection: 'column',
    userSelect: 'text',
    cursor: 'text'
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