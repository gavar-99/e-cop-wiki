import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye } from 'lucide-react';

const KeywordsManagement = ({ onNavigate, onClose }) => {
  const [keywords, setKeywords] = useState([]);
  const [filteredKeywords, setFilteredKeywords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('usage'); // 'usage' or 'alphabetical'
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [expandedKeyword, setExpandedKeyword] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState([]);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [newKeywordName, setNewKeywordName] = useState('');

  useEffect(() => {
    loadKeywords();
  }, []);

  useEffect(() => {
    filterAndSortKeywords();
  }, [keywords, searchQuery, sortBy]);

  const loadKeywords = async () => {
    const data = await window.wikiAPI.getAllTags();
    setKeywords(data);
  };

  const filterAndSortKeywords = () => {
    let filtered = keywords.filter((kw) =>
      kw.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'usage') {
      filtered.sort((a, b) => b.count - a.count);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredKeywords(filtered);
  };

  const handleSelectKeyword = (keywordId) => {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId) ? prev.filter((id) => id !== keywordId) : [...prev, keywordId]
    );
  };

  const handleRenameStart = (keyword) => {
    setEditingKeyword(keyword.id);
    setNewKeywordName(keyword.name);
  };

  const handleRenameSubmit = async (keyword) => {
    if (!newKeywordName.trim() || newKeywordName === keyword.name) {
      setEditingKeyword(null);
      return;
    }

    const result = await window.wikiAPI.renameKeyword({
      oldName: keyword.name,
      newName: newKeywordName.trim(),
    });

    if (result.success) {
      loadKeywords();
      setEditingKeyword(null);
    } else {
      alert(result.message || 'Failed to rename keyword');
    }
  };

  const handleDelete = async (keyword) => {
    const confirmMsg = `Are you sure you want to delete the keyword "${keyword.name}"?\n\nThis keyword is used in ${keyword.count} entries and will be removed from all of them.`;
    if (!confirm(confirmMsg)) return;

    const result = await window.wikiAPI.deleteKeyword(keyword.id);
    if (result.success) {
      loadKeywords();
      setSelectedKeywords((prev) => prev.filter((id) => id !== keyword.id));
    } else {
      alert('Failed to delete keyword');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedKeywords.length === 0) {
      alert('Please select at least one keyword to delete');
      return;
    }

    const selectedKeywordObjects = keywords.filter((kw) =>
      selectedKeywords.includes(kw.id)
    );

    const totalEntries = selectedKeywordObjects.reduce((sum, kw) => sum + kw.count, 0);
    const keywordNames = selectedKeywordObjects.map((kw) => kw.name).join(', ');

    const confirmMsg = `Are you sure you want to delete ${selectedKeywords.length} keyword(s)?\n\nKeywords: ${keywordNames}\n\nThese keywords are used in ${totalEntries} total entries and will be removed from all of them.`;

    if (!confirm(confirmMsg)) return;

    let successCount = 0;
    let failCount = 0;

    for (const keywordId of selectedKeywords) {
      const result = await window.wikiAPI.deleteKeyword(keywordId);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      alert(`Successfully deleted ${successCount} keyword(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
      loadKeywords();
      setSelectedKeywords([]);
    } else {
      alert('Failed to delete keywords');
    }
  };

  const handleViewEntries = async (keyword) => {
    if (expandedKeyword === keyword.id) {
      setExpandedKeyword(null);
      setExpandedEntries([]);
    } else {
      const entries = await window.wikiAPI.getEntriesByKeyword(keyword.id);
      setExpandedKeyword(keyword.id);
      setExpandedEntries(entries);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Search and Controls */}
      <div style={controlsContainerStyle}>
        <div style={searchContainerStyle}>
          <Search size={18} color="#666" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9em', color: '#54595d' }}>
            Sort by:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
              <option value="usage">Usage Count</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </label>

          {selectedKeywords.length > 0 && (
            <button onClick={handleDeleteSelected} style={deleteSelectedButtonStyle}>
              <Trash2 size={16} /> Delete Selected ({selectedKeywords.length})
            </button>
          )}
        </div>
      </div>

      {/* Keywords List */}
      <div style={listContainerStyle}>
        {filteredKeywords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#72777d' }}>
            No keywords found
          </div>
        ) : (
          filteredKeywords.map((keyword) => (
            <div key={keyword.id} style={keywordCardStyle}>
              <div style={keywordRowStyle}>
                <input
                  type="checkbox"
                  checked={selectedKeywords.includes(keyword.id)}
                  onChange={() => handleSelectKeyword(keyword.id)}
                  style={{ cursor: 'pointer' }}
                />

                {editingKeyword === keyword.id ? (
                  <input
                    type="text"
                    value={newKeywordName}
                    onChange={(e) => setNewKeywordName(e.target.value)}
                    onBlur={() => handleRenameSubmit(keyword)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(keyword)}
                    autoFocus
                    style={editInputStyle}
                  />
                ) : (
                  <span 
                    style={{ ...keywordNameStyle, cursor: 'pointer', color: '#0645ad' }}
                    onClick={() => {
                      onNavigate(keyword.name);
                      if (onClose) onClose();
                    }}
                    title={`View article for "${keyword.name}"`}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {keyword.name}
                  </span>
                )}

                <span style={countBadgeStyle}>{keyword.count} entries</span>

                <div style={actionsStyle}>
                  <button
                    onClick={() => handleRenameStart(keyword)}
                    style={actionButtonStyle}
                    title="Rename keyword"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(keyword)}
                    style={{ ...actionButtonStyle, color: '#d33' }}
                    title="Delete keyword"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleViewEntries(keyword)}
                    style={actionButtonStyle}
                    title="View entries"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {expandedKeyword === keyword.id && (
                <div style={expandedEntriesStyle}>
                  <strong>Entries using this keyword:</strong>
                  {expandedEntries.length === 0 ? (
                    <p style={{ color: '#72777d', fontSize: '0.9em', margin: '5px 0' }}>
                      No entries found
                    </p>
                  ) : (
                    <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                      {expandedEntries.map((entry) => (
                        <li key={entry.id} style={{ marginBottom: '5px', fontSize: '0.9em' }}>
                          {entry.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  padding: '30px',
  backgroundColor: '#fff',
};

const controlsContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  gap: '20px',
};

const searchContainerStyle = {
  position: 'relative',
  flex: 1,
  maxWidth: '400px',
};

const searchInputStyle = {
  width: '100%',
  padding: '10px 10px 10px 40px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '1em',
};

const selectStyle = {
  marginLeft: '8px',
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.9em',
  cursor: 'pointer',
};

const deleteSelectedButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  fontWeight: '500',
  transition: 'background-color 0.2s',
};

const listContainerStyle = {
  border: '1px solid #e1e4e8',
  borderRadius: '4px',
  maxHeight: '500px',
  overflowY: 'auto',
};

const keywordCardStyle = {
  borderBottom: '1px solid #e1e4e8',
  padding: '15px',
};

const keywordRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const keywordNameStyle = {
  flex: 1,
  fontSize: '1em',
  color: '#202122',
  fontWeight: '500',
};

const countBadgeStyle = {
  padding: '4px 12px',
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  borderRadius: '12px',
  fontSize: '0.85em',
  fontWeight: '500',
};

const actionsStyle = {
  display: 'flex',
  gap: '8px',
};

const actionButtonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#54595d',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.2s',
};

const editInputStyle = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #36c',
  borderRadius: '4px',
  fontSize: '1em',
};

const expandedEntriesStyle = {
  marginTop: '15px',
  paddingTop: '15px',
  borderTop: '1px solid #e1e4e8',
  fontSize: '0.9em',
  color: '#54595d',
};

export default KeywordsManagement;
